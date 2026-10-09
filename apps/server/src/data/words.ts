import type { PackId } from '@doodle/shared'

const w = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

export const WORDS: Record<PackId, string[]> = {
  classic: w(
    'apple, bridge, candle, castle, clock, cloud, crown, diamond, dragon, drum, feather, flag, ghost, guitar, hammer, igloo, island, key, ladder, lighthouse, magnet, mountain, mushroom, necklace, ocean, parachute, pyramid, rainbow, robot, rocket, scissors, snowman, spider web, sunglasses, telescope, tornado, treasure map, umbrella, volcano, windmill, wizard, zombie, balloon, bicycle, bandage, campfire, chimney, compass, fountain, hourglass, jellyfish, lantern, mermaid, ninja, pirate ship, skateboard, submarine, tent, unicorn, vampire, waterfall, anchor, boomerang, cactus, dinosaur, fireworks, hot air balloon, kite, mailbox, pencil, scarecrow, trampoline, trophy',
  ),
  animals: w(
    'elephant, giraffe, penguin, octopus, kangaroo, crocodile, butterfly, dolphin, flamingo, hedgehog, hippo, koala, lobster, monkey, owl, panda, parrot, peacock, rabbit, rhino, scorpion, seahorse, shark, sloth, snail, squirrel, tiger, turtle, whale, zebra, bat, camel, chameleon, cheetah, cow, deer, duck, eagle, frog, goat, horse, lion, llama, moose, otter, pig, raccoon, seal, sheep, snake, swan, toucan, walrus, wolf, bee, ladybug, crab, starfish, platypus, armadillo',
  ),
  food: w(
    'pizza, hamburger, hot dog, ice cream, cupcake, doughnut, pancake, waffle, sandwich, spaghetti, taco, sushi, popcorn, pretzel, cheese, banana, pineapple, strawberry, watermelon, avocado, broccoli, carrot, corn, mushroom soup, egg, bacon, bread, cookie, chocolate, lollipop, coffee, milkshake, lemonade, burrito, french fries, apple pie, birthday cake, cherry, coconut, grapes, lemon, pear, peach, pumpkin, tomato, onion, garlic, pepper, noodles, dumpling, croissant, candy cane, marshmallow, honey, jam jar, salad, steak, fried egg, sausage, teapot',
  ),
  things: w(
    'toothbrush, backpack, bathtub, bookshelf, broom, bucket, calculator, camera, chair, clipboard, couch, curtain, desk lamp, doorbell, envelope, fan, fork, glasses, headphones, helmet, iron, jar, kettle, keyboard, light bulb, mirror, microphone, notebook, paintbrush, passport, piano, pillow, pliers, remote control, ring, saw, shovel, slippers, soap, spoon, stapler, suitcase, sweater, syringe, thermometer, toaster, towel, trash can, vacuum, wallet, watch, wheelbarrow, window, zipper, bed, bell, binoculars, bowtie, button, calendar',
  ),
  places: w(
    'airport, beach, bridge, castle, desert, eiffel tower, farm, forest, great wall, gas station, hospital, hotel, jungle, library, lighthouse, museum, north pole, pyramid egypt, rainforest, restaurant, school bus, skyscraper, space station, stadium, statue of liberty, subway, supermarket, taj mahal, train station, treehouse, tunnel, village, zoo, amusement park, aquarium, barn, camping, canyon, cave, church, circus, city, harbor, igloo village, moon, mountain cabin, oasis, playground, port, volcano island',
  ),
  tech: w(
    'laptop, smartphone, satellite, rocket launch, robot arm, drone, circuit board, microscope, telescope, atom, dna, battery, bluetooth, camera drone, chip, cloud storage, database, hard drive, internet, joystick, keyboard, magnet, mouse, planet, radar, router, solar panel, space suit, spaceship, usb stick, virtual reality, wifi, wind turbine, x-ray, alien, astronaut, black hole, comet, galaxy, gravity, lightning, meteor, moon landing, orbit, rover, saturn, solar system, test tube, vaccine, electric car',
  ),
}
