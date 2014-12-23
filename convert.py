import sys 
import os
import csv

import png


if len(sys.argv) < 2:
	print("Please pass in an image file")
	raise Exception

color_map = {(0, 162, 232) : 1, (34, 177, 76) : 2, (237, 28, 36) : 3, (255, 242, 0) : 4, (163, 73, 164): 5}

tiles = []

im = png.Reader(sys.argv[1]) 
width, height, data, metadata = im.read()
pixel_byte_width = 4 if metadata['alpha'] else 3
row_num = 0
for row in data:
	# print(row)
	tiles.append([])
	count = 0
	for pixel in row:
		if count == 0:
			R = pixel
		elif count == 1:
			G = pixel
		elif count == 2:
			B = pixel
		if pixel_byte_width == 4:
			if count == 3:
				ALPHA = pixel
		count += 1
		if (count == pixel_byte_width):
			tiles_number = 0
			for key in color_map:
				if (abs(key[0] - R) < 15) and (abs(key[1] - G) < 15) and (abs(key[2] - B) < 15):
					tiles_number = color_map[key]
			tiles[row_num].append(tiles_number)
			count = 0
	row_num += 1

f = open(sys.argv[1][0:-4] + ".csv", 'wb')
writer = csv.writer(f)
for line in tiles:
	writer.writerow(line)
    