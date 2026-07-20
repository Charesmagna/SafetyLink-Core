# SafetyLink Project

## Section 1: LOCAL TEST with localhost
To run this project locally:
1. Ensure you have Docker and Docker Compose installed.
2. Run `docker-compose up --build -d`.
3. Access the backend at `http://localhost:3000`.
4. Access OwnCloud at `http://localhost:8080` (admin/admin).
5. Access NTFY at `http://localhost:2586`.

## Section 2: ORACLE DEPLOY
To deploy on an Oracle Cloud instance:
1. SSH into your Oracle Cloud Compute instance.
2. Clone this repository.
3. Update `docker-compose.yml` with your public IP instead of `localhost`.
4. Run `docker-compose up -d`.
5. Ensure ports 3000, 8080, and 2586 are open in the Oracle Cloud Security List.

## Section 3: HOW TO GET GEMINI API KEY
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google Account.
3. Click on "Get API Key" in the left sidebar.
4. Create a new API key or copy an existing one.
5. Set it in your `.env` file as `GEMINI_API_KEY=your_api_key_here`.
