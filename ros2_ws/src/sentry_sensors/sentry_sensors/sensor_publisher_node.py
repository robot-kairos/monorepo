#!/usr/bin/env python3
from __future__ import annotations

import random
import threading
import serial

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSPresetProfiles
from std_msgs.msg import Float32, Bool
from sensor_msgs.msg import Temperature, RelativeHumidity
from robot_interfaces.msg import Telemetry, RadarVitals

QOS = QoSPresetProfiles.SENSOR_DATA.value

SERIAL_PORT = '/dev/ttyACM1'
SERIAL_BAUD = 9600


class SensorPublisherNode(Node):

    def __init__(self):
        super().__init__('sensor_publisher')

        self._pub_telemetry   = self.create_publisher(Telemetry,        '/robot/telemetry',           QOS)
        self._pub_temperature = self.create_publisher(Temperature,      '/robot/sensors/temperature', QOS)
        self._pub_humidity    = self.create_publisher(RelativeHumidity, '/robot/sensors/humidity',    QOS)
        self._pub_co2         = self.create_publisher(Float32,          '/robot/sensors/co2',         QOS)
        self._pub_vitals      = self.create_publisher(RadarVitals,      '/robot/radar/vitals',        QOS)

        self._timer_1hz = self.create_timer(1.0, self._publish_1hz)
        self._timer_2hz = self.create_timer(0.5, self._publish_2hz)

        # Stato interno
        self._batt            = 72.0
        self._ambient_temp    = 25.0   # fallback finché non arriva dato reale
        self._object_temp     = 25.0

        # Connessione seriale Arduino in thread separato
        self._serial_lock = threading.Lock()
        self._serial_thread = threading.Thread(target=self._read_serial, daemon=True)
        try:
            self._ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=2)
            self._serial_thread.start()
            self.get_logger().info(f'Seriale aperta su {SERIAL_PORT} @ {SERIAL_BAUD} baud')
        except serial.SerialException as e:
            self._ser = None
            self.get_logger().warn(f'Porta seriale non disponibile: {e} — uso dati simulati per temperatura')

        self.get_logger().info('SensorPublisherNode avviato')

    # ------------------------------------------------------------------
    # Thread lettore seriale
    # ------------------------------------------------------------------

    def _read_serial(self):
        """Legge continuamente righe CSV 'ambient,object' dall'Arduino."""
        # Svuota buffer iniziale
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
                self.get_logger().warn(f'Errore lettura seriale: {e}')

    # ------------------------------------------------------------------
    # 1 Hz: telemetry, temperature, humidity, co2
    # ------------------------------------------------------------------

    def _publish_1hz(self):
        now = self.get_clock().now().to_msg()
        self._batt = max(0.0, self._batt - 0.02)

        # Telemetry (simulata)
        t = Telemetry()
        t.header.stamp    = now
        t.link_quality    = random.uniform(60.0, 100.0)
        t.battery_percent = self._batt
        t.signal_dbm      = random.uniform(-90.0, -40.0)
        self._pub_telemetry.publish(t)

        # Temperature — dato REALE dall'Arduino (object temp)
        with self._serial_lock:
            ambient_val = self._ambient_temp
            object_val  = self._object_temp

        temp = Temperature()
        temp.header.stamp = now
        temp.temperature  = object_val   # temperatura oggetto puntato
        temp.variance     = 0.0
        self._pub_temperature.publish(temp)

        # Log entrambi i valori
        self.get_logger().info(
            f'Temp — Ambiente: {ambient_val:.1f}°C | Oggetto: {object_val:.1f}°C'
        )

        # Humidity (simulata)
        hum = RelativeHumidity()
        hum.header.stamp      = now
        hum.relative_humidity = random.uniform(0.20, 0.80)
        hum.variance          = 0.0
        self._pub_humidity.publish(hum)

        # CO2 (simulata)
        co2 = Float32()
        co2.data = random.uniform(400.0, 1200.0)
        self._pub_co2.publish(co2)

    # ------------------------------------------------------------------
    # 2 Hz: radar vitals (simulati)
    # ------------------------------------------------------------------

    def _publish_2hz(self):
        now = self.get_clock().now().to_msg()

        v = RadarVitals()
        v.header.stamp         = now
        v.heart_rate           = random.uniform(55.0, 130.0)
        v.breath_rate          = random.uniform(10.0, 28.0)
        v.target_distance      = random.uniform(1.0, 8.0)
        v.target_azimuth_deg   = random.uniform(-45.0, 45.0)
        v.target_elevation_deg = random.uniform(-20.0, 20.0)
        v.snr_db               = random.uniform(10.0, 40.0)
        v.target_detected      = True
        self._pub_vitals.publish(v)


def main(args=None):
    rclpy.init(args=args)
    node = SensorPublisherNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()