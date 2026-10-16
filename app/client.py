"""The single Inngest client shared by the API and every function."""

import inngest

# INNGEST_DEV and INNGEST_BASE_URL come from the environment (see compose.yaml).
inngest_client = inngest.Inngest(app_id="inngest-demo", is_production=False)
