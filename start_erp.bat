@echo off
:: Start application in a new Windows Terminal tab
wt -w 0 new-tab -d "D:\projects\Kamran\jfk-erp" cmd /k "docker compose up --build -d"
