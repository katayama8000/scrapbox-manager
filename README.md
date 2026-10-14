# Scrapbox Manager

This CLI allows you to control Scrapbox directly from your terminal.

## Setup and Usage

1. **Clone the Repository**

   ```bash
   git clone https://github.com/katayama8000/scrapbox-manager
   cd scrapbox-manager
   ```

2. **Install Deno**

   If you don't have Deno installed, you can install it from here:
   [https://deno.land/manual/getting_started/installation](https://deno.land/manual/getting_started/installation)

3. **Configure Environment**
   - Copy `.env.dist` to `.env` and set required environment variables:
     ```bash
     cp .env.dist .env
     ```
   - `COSENSE_PAT` (required for writing to Cosense)
     - Issue this token from your own Cosense account settings.
     - This CLI only reads the token from environment variables. It never
       fetches or provisions tokens automatically.

- AI provider is fixed to Sarashina.
- `SARASHINA_API_KEY` is required for AI features.
- Model (`sarashina3-mini`) and endpoint (`https://api.sarashina.ai/v1`) are
  fixed in code.

4. **Run Commands**
   - Deno automatically downloads dependencies on the first run.
   - For daily updates:
     ```bash
     deno task daily
     ```
   - For weekly updates:
     ```bash
     deno task weekly
     ```

5. **Run on GitHub Actions**
   - set secrets in your repository settings:
     - `COSENSE_PAT`
     - `DISCORD_WEBHOOK`
     - `BACKLOG_API_KEY`

- `COSENSE_PAT` must be created and managed by repository maintainers.
- Enable GitHub Actions in your repository.

## Architecture

This project's design is a hybrid of **Clean Architecture** and **Hexagonal
Architecture** (Ports and Adapters).

- It uses the layered structure of Clean Architecture (`domain`, `application`,
  `infrastructure`) to separate concerns.
- It implements the "Ports and Adapters" pattern from Hexagonal Architecture,
  using interfaces (`ports`) to decouple the application core from external
  tools like APIs.

The key principle is the **Dependency Rule**: dependencies only flow inwards,
from `infrastructure` to `application` to `domain`. This makes the core business
logic independent of external details, improving testability and
maintainability.

For a more detailed breakdown and diagrams, see
[ARCHITECTURE.md](ARCHITECTURE.md).
