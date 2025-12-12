# Instructions d'installation

Si vous avez des problèmes avec npm install, suivez ces étapes :

1. Ouvrez PowerShell en tant qu'administrateur
2. Naviguez vers le dossier backend :
   ```
   cd C:\Users\MSI\Desktop\Formini\backend
   ```

3. Installez formidable manuellement :
   ```
   npm install formidable@3.5.1 --save
   ```

4. Vérifiez l'installation :
   ```
   npm list formidable
   ```

5. Si cela ne fonctionne pas, essayez :
   ```
   npm cache clean --force
   npm install
   ```

6. Ensuite, lancez le serveur :
   ```
   npm start
   ```
