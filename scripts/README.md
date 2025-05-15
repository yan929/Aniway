# Database Management (Import)

This document outlines the steps to import the `aniway` database into a local MongoDB instance.

**Prerequisites:**

- MongoDB Database Tools installed ([Installation Guide](https://www.mongodb.com/docs/database-tools/installation/installation/)).
- Access to the MongoDB instance (ensure the correct connection URI, username, and password are used).
- Download the database dump file: [aniway_dump.tar.gz](http://ptytqjqmd.bkt.clouddn.com/aniway_dump.tar.gz) (You need to delete all ".\_\*" files if you are using Windows)

## Importing the Database (`mongorestore`)

This command restores the database dump into your local (or target) MongoDB instance.

1.  **Download and Extract:**
    Download the shared database dump file (e.g., `aniway_dump.tar.gz`) and extract it. You should have a folder named `aniway_backup` containing `.bson` and `.metadata.json` files.

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

    _(Note: Adjust the `localhost:27017` part if your local MongoDB runs on a different host or port)_

After running `mongorestore`, the `aniway` database should be populated in your target MongoDB instance.
