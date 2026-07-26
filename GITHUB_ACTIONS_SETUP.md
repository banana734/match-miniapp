GitHub Actions setup for Match server
====================================

1. Create a GitHub repository for this project.
2. Create a Docker Hub repository named `match-server`.
3. In GitHub repository settings, open:
   Settings -> Secrets and variables -> Actions
4. Add these repository secrets:
   - `DOCKERHUB_USERNAME`
   - `DOCKERHUB_TOKEN`
5. Push this project to the `main` branch.
6. Open the Actions tab on GitHub and run:
   `Build And Publish Server Image`
7. After the workflow succeeds, your image will be available as:
   `docker.io/<your-dockerhub-username>/match-server:latest`
8. Use that image address in Sealos App Management.

Suggested Git commands
----------------------

```bash
git init
git add .
git commit -m "Init Match project"
git branch -M main
git remote add origin https://github.com/<your-github-username>/<your-repo-name>.git
git push -u origin main
```

Docker Hub token
----------------

Use a Docker Hub access token instead of your account password.
