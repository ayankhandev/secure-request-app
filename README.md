# Secure Request App

## What does this app do?

Imagine you want to pass a secret note to your friend in class, but the teacher might read it.

So instead of writing the note in plain English, you lock it inside a box before passing it. Your friend has the only key to open that box. Even if the teacher grabs the box, all they see is a locked box — they can't read anything inside.

**This app does exactly that — but for login credentials sent over the internet.**

---

## The problem it solves

When you type your username and password into a normal login form, those details are packaged up and sent to the server. Without encryption, anyone sitting between your browser and the server (like on a public Wi-Fi) could read them.

This app makes sure **nothing readable ever travels over the wire** — not the username, not the password, not even the server's reply.

---

## How it works (the box-and-key story)

There are **two keys** involved — like a special magic padlock:

- **Public key** — anyone can use this to *lock* a box. The browser has it.
- **Private key** — only the server has this. It is the only thing that can *unlock* the box.

Here is what happens when you click "Sign in":

```
1. Browser makes a fresh secret code (called a session key) — like making up a new password on the spot.

2. Browser locks that secret code inside a box using the public key and sends it to the server.

3. Browser also locks your credentials (username + password) using the secret code.

4. Server receives both locked boxes.

5. Server uses the private key to open the first box and gets the secret code.

6. Server uses the secret code to open the second box and reads your credentials.

7. Server checks if your login is correct, then locks its reply using the same secret code.

8. Browser unlocks the reply using the secret code it made in step 1.
```

At no point does the username, password, or reply travel as plain readable text.

---

## Why two layers? (RSA + AES)

The big padlock (RSA) can only lock very small things — it would be too slow and limited to lock your whole message.

So instead:

- RSA locks **only the tiny secret code** (32 bytes).
- AES-GCM locks **the actual message** using that secret code (fast, no size limit, tamper-proof).

This is called **hybrid encryption** and it is how HTTPS, Signal, and most real-world secure systems work under the hood.

---

## Project structure

```
secure-request-app/
├── app/
│   ├── page.tsx              # The login page UI
│   ├── login-form.tsx        # Encrypts credentials before sending, decrypts the reply
│   └── api/
│       └── login/
│           └── route.ts      # Server: decrypts the request, encrypts the response
├── lib/
│   └── crypto.ts             # All encryption logic lives here
├── scripts/
│   └── generate-keys.mjs     # One-time script to create your RSA key pair
└── .env.local                # Stores the keys (never commit this file)
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Generate your RSA key pair

This creates a brand-new public/private key pair and prints the lines you need for `.env.local`.

```bash
node scripts/generate-keys.mjs
```

Copy the output into your `.env.local` file. It will look like this:

```
NEXT_PUBLIC_RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

> **Never commit `.env.local` to git.** The private key must stay on the server only.
> If it ever leaks, run the generate script again and replace both keys.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo credentials: `admin` / `password`

---

## How to verify it is actually secure

### Check the network traffic

Open DevTools → Network tab → submit the form. The request body looks like:

```json
{
  "envelope": {
    "encryptedKey": "a3Fk9mN...",
    "iv": "pQ7rLx...",
    "payload": "Zk2wYt..."
  }
}
```

And the response:

```json
{
  "iv": "hR4nBv...",
  "payload": "Xm8sOp..."
}
```

Pure noise. No credentials, no messages — just locked boxes.

### Confirm the private key never reaches the browser

```bash
grep -r "PRIVATE KEY" .next/static/ && echo "PROBLEM" || echo "Safe — private key not in client bundle"
```

### Confirm tampered data is rejected

Send garbage to the server:

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"envelope":{"encryptedKey":"AAAA","iv":"AAAA","payload":"AAAA"}}'
```

You get: `{"error":"Failed to decrypt payload."}` — the server refuses to process it and reveals nothing.

---

## Security properties

| Property | How it is achieved |
|---|---|
| Credentials never in plain text | AES-GCM encryption before the request leaves the browser |
| Only the server can decrypt | RSA private key lives only in the server environment |
| Response is also encrypted | Server encrypts its reply with the same session key |
| Tampered data is rejected | AES-GCM includes an authentication tag — any modification is detected |
| No two requests share a key | A fresh session key and IV are generated for every single request |
| Private key not in the browser bundle | Only `NEXT_PUBLIC_` variables are shipped to the client; `RSA_PRIVATE_KEY` is server-only |

---

## Moving to Express (production)

The crypto logic in `lib/crypto.ts` uses only the **Web Crypto API** (`globalThis.crypto.subtle`), which is built into the browser and into Node.js 18+. No third-party crypto library is used.

To use this in an Express server, copy `lib/crypto.ts` as-is and call `decryptRequest` / `encryptResponse` the same way the Next.js route handler does.

```ts
// Express equivalent
app.post("/api/login", async (req, res) => {
  const { plaintext, sessionKey } = await decryptRequest(req.body.envelope, process.env.RSA_PRIVATE_KEY);
  // ... verify credentials ...
  const encrypted = await encryptResponse(JSON.stringify({ message: "ok" }), sessionKey);
  res.json(encrypted);
});
```

---

## What is NOT covered here

- **Key rotation** — if the private key leaks, regenerate and redeploy. There is no automatic rotation.
- **HTTPS** — this app-layer encryption is an extra layer of protection. You still need HTTPS in production so the public key itself cannot be swapped out by a man-in-the-middle.
- **Rate limiting / brute force protection** — add that at the server or infrastructure level.
- **Session management** — after login, use a proper session token or JWT. This app only covers the login handshake.
