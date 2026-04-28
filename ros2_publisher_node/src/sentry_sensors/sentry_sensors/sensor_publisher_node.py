#!/usr/bin/env python3
from __future__ import annotations

import random
import threading
import serial

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSPresetProfiles
from std_msgs.msg import Float32, Bool
from robot_interfaces.msg import RadarVitals, Temperature

QOS = QoSPresetProfiles.SENSOR_DATA.value

SERIAL_PORT = '/dev/ttyACM1'
SERIAL_BAUD = 9600


class SensorPublisherNode(Node):

    def __init__(self):
        super().__init__('sensor_publisher')

        self._pub_temperature = self.create_publisher(Temperature,      '/robot/sensors/temperature', QOS)
        self._pub_vitals      = self.create_publisher(RadarVitals,      '/robot/radar/vitals',        QOS)

        self._timer_1hz = self.create_timer(1.0, self._publish_1hz)
        self._timer_2hz = self.create_timer(0.5, self._publish_2hz)

        # Internal state
        self._ambient_temp    = 25.0   # fallback until real data arrives
        self._object_temp     = 25.0

        # Arduino serial connection in a separate thread
        self._serial_lock = threading.Lock()
        self._serial_thread = threading.Thread(target=self._read_serial, daemon=True)
        try:
            self._ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=2)
            self._serial_thread.start()
            self.get_logger().info(f'Serial port opened on {SERIAL_PORT} @ {SERIAL_BAUD} baud')
        except serial.SerialException as e:
            self._ser = None
            self.get_logger().warn(f'Serial port not available: {e} — using simulated temperature data')

        self.get_logger().info('SensorPublisherNode started')

    # ------------------------------------------------------------------
    # Serial reader thread
    # ------------------------------------------------------------------

    def _read_serial(self):
        """Continuously reads CSV lines 'ambient,object' from the Arduino."""
        # Flush initial buffer
        self._ser.readline()
        self._ser.readline()

        while rclpy.ok():
            try:
                raw = self._ser.readline().decode('utf-8', errors='ignore').strip()
                if not raw or ',' not in raw:
                    continue
                parts = raw.split(',')
                if len(parts) != 2:
                    continue
                ambient = float(parts[0])
                obj     = float(parts[1])
                with self._serial_lock:
                    self._ambient_temp = ambient
                    self._object_temp  = obj
            except (ValueError, serial.SerialException) as e:
                self.get_logger().warn(f'Serial read error: {e}')

    # ------------------------------------------------------------------
    # 1 Hz: temperature
    # ------------------------------------------------------------------

    def _publish_1hz(self):
        now = self.get_clock().now().to_msg()

        # Temperature — REAL data from Arduino (object temp)
        with self._serial_lock:
            ambient_val = self._ambient_temp
            object_val  = self._object_temp

        temp = Temperature()
        temp.header.stamp = now
        temp.temp_ambient = ambient_val
        temp.temp_object  = object_val
        self._pub_temperature.publish(temp)

        # Log both values
        self.get_logger().info(
            f'Temp — Ambient: {ambient_val:.1f}°C | Object: {object_val:.1f}°C'
        )

    # ------------------------------------------------------------------
    # 2 Hz: radar vitals (simulated)
    # ------------------------------------------------------------------

    def _publish_2hz(self):
        now = self.get_clock().now().to_msg()

        v = RadarVitals()
        v.header.stamp         = now
        v.heart_rate           = random.uniform(55.0, 130.0)
        v.breath_rate          = random.uniform(10.0, 28.0)
        v.target_distance      = random.uniform(1.0, 8.0)
        self._pub_vitals.publish(v)


def main(args=None):
    rclpy.init(args=args)
    node = SensorPublisherNode()
    try:
        while rclpy.ok():
            rclpy.spin_once(node, timeout_sec=0.1)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
