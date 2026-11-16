/* Accounts backend. Leave both values empty and the app keeps accounts on the device only.
   Fill them in (see docs/BACKEND.md) and registration becomes real: an emailed 6-digit code, an account per email,
   progress saved to the account, and sign-ups counted across every device.
   The key that goes here is Supabase's public "anon" key. It is meant to be public; the database rules protect the data. */
window.ICON_CONFIG = {
  supabaseUrl: "",
  supabaseKey: ""
};
