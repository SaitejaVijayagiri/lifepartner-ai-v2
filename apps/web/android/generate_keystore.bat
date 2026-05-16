@echo off
echo Generating Release Keystore for LifePartner AI...
echo.
echo Make sure to remember the password you set!
echo.
keytool -genkey -v -keystore lifepartner.jks -alias lifepartner -keyalg RSA -keysize 2048 -validity 10000
echo.
echo Done! Now copy keystore.properties.template to keystore.properties and update the passwords.
pause
