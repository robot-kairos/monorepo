# robot_ros2_publisher

ROS 2 node running on Arduino that publishes topics

This should read from esp32 all sensor data and publish them here, which will be read from a ROS 2 subscriber running on the laptop

or we can run [micro ros](https://micro.ros.org/) on ESP32 as well

This can be run using Docker to simplify deployment (e.g. on arduino), as shown below

## Docker

Docker also allows easy testing on the dev machines.

Requires Docker. Base image: `ros:jazzy`.

### Build

```bash
docker build -t robot_ros2_publisher .
```

### Run

The node reads from the Arduino over serial (`/dev/ttyACM1` by default). Pass the device through with `--device`:

```bash
docker run --rm --device /dev/ttyACM1 --network host robot_ros2_publisher
```

`--network host` lets the container participate in the ROS 2 DDS discovery on the local network so a subscriber on the host or another machine can see the published topics.

If the Arduino is on a different port, override the serial device at runtime by setting the `SERIAL_PORT` environment variable (requires a matching change in `sensor_publisher_node.py` to read it), or just rebuild with the correct port hardcoded.

### Run without hardware (simulated data)

Omit `--device` — the node will log a warning and fall back to simulated temperature values:

```bash
docker run --rm --network host robot_ros2_publisher
```

### Verify topics

```bash
ros2 topic list
ros2 topic echo /robot/sensors/temperature
```

