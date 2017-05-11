@echo off
set PATH=%PATH%;D:\bin\aims_deduplication\nodejs
cd D:\bin\aims_deduplication\aims_deduplication
MountSharedDrive.exe
npm start
start http://localhost:3000
