<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Connexion — RSL</title>
  <style>
    body{font-family:system-ui,Arial,sans-serif;max-width:520px;margin:40px auto;padding:0 16px;text-align:center}
    input,button{padding:10px;font-size:16px;margin:5px;width:100%}
    .muted{opacity:.7;font-size:.9em;margin-top:10px}
  </style>
</head>
<body>
  <h1>Connexion à RSL</h1>
  <form id="signup">
    <h3>Créer un compte</h3>
    <input id="name" placeholder="Nom complet" required>
    <input id="email" type="email" placeholder="Email" required>
    <input id="password" type="password" placeholder="Mot de passe" required>
    <button>S'inscrire</button>
  </form>

  <form id="login">
    <h3>Se connecter</h3>
    <input id="lemail" type="email" placeholder="Email" required>
    <input id="lpass" type="password" placeholder="Mot de passe" required>
    <button>Connexion</button>
  </form>

  <p id="msg" class="muted"></p>

  <script type="module">
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm'

    const supabaseUrl = 'https://jynxifufaouxwjzapzq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bnhpZnVmYWF1b3h3emphcHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzODI2NzcsImV4cCI6MjA3Njk1ODY3N30.vFPGhGakPIM3Xg5rn8_BrAXl6oJMJOssO780C9nXmr4';

    const supabase = createClient(supabaseUrl, supabaseKey);
    const msg = document.getElementById('msg');

    // inscription
    document.getElementById('signup').addEventListener('submit', async (e) => {
      e.preventDefault();
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: { data: { full_name: name.value } }
      });
      msg.textContent = error ? '❌ ' + error.message : '✅ Compte créé, vérifie ton email.';
    });

    // connexion
    document.getElementById('login').addEventListener('submit', async (e) => {
      e.preventDefault();
      const { error } = await supabase.auth.signInWithPassword({
        email: lemail.value,
        password: lpass.value
      });
      msg.textContent = error ? '❌ ' + error.message : '✅ Connecté !';
    });
  </script>
</body>
</html>