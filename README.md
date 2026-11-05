# Australian Navy Cadets - Uniform Tracker

This project is a role-based starter tracker for a cadet uniform store.

Important: this is a demo implementation using browser local storage only. It gives you three login roles for development and demonstration:

- Head of Logistics
- Officer
- Cadet

It is not a production-grade secure authentication system. For a live school environment you should replace the local storage login with Supabase Auth, Firebase Auth, or another secure authentication provider.

## Demo logins

- Username: `headlogistics` | Password: `password123`
- Username: `officer` | Password: `password123`
- Username: `cadet` | Password: `password123`

## Roles

### Head of Logistics
- Add or update stock items
- Record stock movements
- View the full inventory
- Export stock to CSV

### Officer
- Record stock movements
- Issue kit to cadets
- Receive returned kit
- View the full inventory

### Cadet
- View their own issued kit list only

## Usage

1. Open `index.html` in a browser.
2. Log in using one of the demo accounts.
3. Use the dashboard to record or review stock.

## Data storage

The app saves all data in the browser's local storage under the key `cadet-uniform-tracker-v1`.

Because it is local to the browser, the data is not shared across devices or users. If you want a shared real-world tracker, the next step is to connect this to a database and secure authentication service.

## Recommended next step for production

Use Supabase with:
- Row Level Security
- Authentication (email or username/password)
- A `users` table with roles
- A `stock` table and an `issues` table

This app is ready to be extended into that model if you want.
