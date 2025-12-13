import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Supabase says: "User is here to reset password"
        setRecoveryMode(true);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleUpdate(e: any) {
    e.preventDefault();

    if (!recoveryMode) {
      setStatus("Invalid or expired reset link.");
      return;
    }

    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Password updated successfully. Please log in with your new password.");
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h2>Reset Password</h2>

      {!recoveryMode && (
        <p>This link is invalid, expired, or already used.</p>
      )}

      {status && <p>{status}</p>}

      {recoveryMode && (
        <form onSubmit={handleUpdate}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <button type="submit">Update Password</button>
        </form>
      )}
    </div>
  );
}
