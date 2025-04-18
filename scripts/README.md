# Database Management (Export/Import)

This document outlines the steps to export the `aniway` database for sharing and import it into a local MongoDB instance.

**Prerequisites:**

- MongoDB Database Tools installed ([Installation Guide](https://www.mongodb.com/docs/database-tools/installation/installation/)).
- Access to the MongoDB instance (ensure the correct connection URI, username, and password are used).

## Exporting the Database (`mongodump`) _IGNORE THIS PART_

This command dumps the entire `aniway` database into a directory named `db_dump/aniway` relative to where you run the command.

1.  **Navigate** to the project's root directory in your terminal:

    ```bash
    cd /path/to/group-project-team-rocket-webmasters
    ```

2.  **Run `mongodump`:**
    Replace `<MONGO_URI_WITH_ADMIN_AUTH>` with your actual connection string, typically found in `backend/.env` or similar (ensure it points to the `admin` database for authentication if needed). If your URI already specifies the `aniway` database, you might adjust the URI or command slightly.

    ```bash
    mongodump --uri="<MONGO_URI_WITH_ADMIN_AUTH>" --db=aniway --out=./db_dump/aniway
    ```

3.  **(Optional) Compress the dump:**
    Navigate into the `db_dump` directory and create an archive (e.g., zip or tar.gz) of the `aniway` folder.

    ```bash
    cd db_dump
    tar -czvf aniway_dump.tar.gz aniway
    # Or use zip: zip -r aniway_dump.zip aniway
    cd ..
    ```

4.  **Share the dump:**
    Upload the compressed file (`aniway_dump.tar.gz` or `aniway_dump.zip`) to your chosen object storage or file-sharing service.

## Importing the Database (`mongorestore`)

This command restores the database dump into your local (or target) MongoDB instance.

1.  **Download and Extract:**
    Download the shared database dump file (e.g., `aniway_dump.tar.gz`) and extract it. You should have a folder named `aniway` containing `.bson` and `.metadata.json` files.

    ```bash
    tar -xzvf aniway_dump.tar.gz
    # Or use unzip: unzip aniway_dump.zip
    ```

    This creates the `aniway` directory containing the dump.

2.  **Run `mongorestore`:**
    Replace `<MONGO_URI_WITH_ADMIN_AUTH>` with the connection URI for the _target_ MongoDB instance. The command points to the _directory containing the database dump_ (`./aniway` in this case).

    ```bash
    mongorestore --uri="<MONGO_URI_WITH_ADMIN_AUTH>" --nsInclude="aniway.*" --drop ./aniway
    ```

    - `--uri`: Specifies the connection string for the target MongoDB.
    - `--nsInclude="aniway.*"`: Ensures only the `aniway` database is affected.
    - `--drop`: Drops each collection from the target database before restoring it from the dump (ensures a clean import).
    - `./aniway`: The path to the _directory_ containing the dumped database files (`.bson`, `.metadata.json`).

    _(Note: Adjust the `localhost:27017` part if your local MongoDB runs on a different host or port)_

After running `mongorestore`, the `aniway` database should be populated in your target MongoDB instance.
