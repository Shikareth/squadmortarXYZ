npm i create-nodew-exe -g
npm i express
npm i jimp
npm install -g pkg
https://nodejs.org/download/release/v18.18.2/node-v18.18.2-x64.msi

pkg squadMortarServer.js -t=win

pkg imageLayering.js -t=win

create-nodew-exe squadMortarServer.exe squadMortarServerSilent.exe

create-nodew-exe imageLayering.exe imageLayeringSilent.exe

