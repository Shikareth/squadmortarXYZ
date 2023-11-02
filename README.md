npm i create-nodew-exe -g
npm i express
npm i jimp

pkg squadMortarServer.js -t=win

pkg imageLayering.js -t=win

create-nodew-exe squadMortarServer.exe squadMortarServerSilent.exe

create-nodew-exe imageLayering.exe imageLayeringSilent.exe