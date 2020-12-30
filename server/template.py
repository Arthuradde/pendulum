
import math
import time
import random

omega = 0
alpha = 0
prev_alpha = 0

angular_offset = initial_angular_offset
x_position = math.sin(angular_offset/180*math.pi)*string_length
y_position = math.cos(angular_offset/180*math.pi)*string_length
wind_factor = random.randint(-50,50)

DELTA_T = 0.05

for i in range(50):
  dtheta = omega * DELTA_T + (alpha * DELTA_T * DELTA_T /2)
  angular_offset += dtheta/math.pi*180
  if (abs(angular_offset) > 90):
    angular_offset = 90 * angular_offset/abs(angular_offset)
  prev_alpha = alpha
  wind_force = wind_factor * math.cos(angular_offset/180*math.pi)
  force = mass * 9.81 * -math.sin(angular_offset/180*math.pi) + wind_force
  alpha = force / (mass * string_length /500 )
  omega += 0.5 * (alpha + prev_alpha) * DELTA_T
  x_position = math.sin(angular_offset/180*math.pi)*string_length
  y_position = math.cos(angular_offset/180*math.pi)*string_length

  print("x: " + str(x_position) + ", y: " + str(y_position) + ", theta: " + str(angular_offset))
  time.sleep(0.5)