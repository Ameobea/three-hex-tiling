run:
  yarn dev

build:
  yarn build

publish:
  yarn publish

build-demo:
  yarn build:demo

publish-demo:
  phost update three-hex-tiling patch demo/dist
