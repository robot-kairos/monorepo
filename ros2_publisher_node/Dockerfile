FROM ros:jazzy

# Install Python serial library (for Arduino communication)
RUN apt-get update && apt-get install -y \
    python3-serial \
    && rm -rf /var/lib/apt/lists/*

# Set up colcon workspace
WORKDIR /ws
COPY src/ src/

# Build both packages: robot_interfaces (custom msgs) then sentry_sensors
RUN . /opt/ros/jazzy/setup.sh && \
    colcon build --symlink-install

# Extend the default ROS entrypoint to also source our workspace overlay
RUN sed -i '/exec "\$@"/i source /ws/install/setup.bash' /ros_entrypoint.sh

ENTRYPOINT ["/ros_entrypoint.sh"]
CMD ["ros2", "run", "sentry_sensors", "sensor_publisher"]
