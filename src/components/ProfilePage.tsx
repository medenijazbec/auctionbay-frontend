import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.css';

const API = 'https://localhost:7056';

/* ─── DTOs ──────────────────────────────────────────────── */
interface UserMe {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
}

/* ─── tiny modal helper ─────────────────────────────────── */
type ModalProps = { open: boolean; onClose: () => void; children: React.ReactNode };
const Modal: React.FC<ModalProps> = ({ open, onClose, children }) =>
  !open ? null : (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

/* ─── main component ────────────────────────────────────── */
const ProfilePage: React.FC = () => {
  const nav = useNavigate();
  const token = localStorage.getItem('token');
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  /* state */
  const [me, setMe] = useState<UserMe | null>(null);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [mail, setMail] = useState('');
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  /* modal state */
  const [pwOpen, setPwOpen] = useState(false);
  const [picOpen, setPicOpen] = useState(false);

  /* picture helpers */
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /* ─── fetch profile once ─────────────────────────────── */
  useEffect(() => {
    if (!token) {
      nav('/login');
      return;
    }
    fetch(`${API}/api/Profile/me`, auth)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((u: UserMe) => {
        setMe(u);
        setFirst(u.firstName);
        setLast(u.lastName);
        setMail(u.email);
      })
      .catch(() => setFlash({ ok: false, text: 'Could not load profile.' }))
      .finally(() => setLoading(false));
  }, [token, nav]);

  /* ─── empty / error state ────────────────────────────── */
  if (loading)
    return (
      <div className={styles.emptyState}>
        <h3>Loading…</h3>
      </div>
    );
  if (!me)
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyStateTitle}>Oops, nothing here!</h3>
        <p className={styles.emptyStateDesc}>
          We couldn’t fetch your profile. Please try again.
        </p>
        <button className={styles.retryBtn} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );

  /* ─── save basic profile ─────────────────────────────── */
  const saveProfile = async () => {
    setFlash(null);

    try {
      const resp = await fetch(`${API}/api/Profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.headers },
        body: JSON.stringify({ firstName: first, lastName: last, email: mail }),
      });

      if (!resp.ok) {
        /* try to read {error:"…"} or Identity errors array */
        const data = await resp.json().catch(() => ({}));
        const msg =
          data.error ??
          data[0]?.description ?? /* IdentityError[] */
          'Could not save profile.';
        setFlash({ ok: false, text: msg });
        return;
      }

      setFlash({ ok: true, text: 'Profile saved.' });
    } catch {
      setFlash({ ok: false, text: 'Network error. Please try again.' });
    }
  };

  /* ─── password change ───────────────────────────────── */
  const changePw = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      const r = await fetch(`${API}/api/Profile/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.headers },
        body: JSON.stringify({
          currentPassword: d.get('current'),
          newPassword: d.get('new'),
          confirmNewPassword: d.get('confirm'),
        }),
      });
      if (!r.ok) throw new Error();
      setPwOpen(false);
      setFlash({ ok: true, text: 'Password updated.' });
    } catch {
      setFlash({ ok: false, text: 'Password change failed.' });
    }
  };

  /* ─── picture select & upload ───────────────────────── */
  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };
  const savePic = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const up = await fetch(`${API}/api/ImageUpload`, {
        method: 'POST',
        body: fd,
        headers: auth.headers,
      });
      const { url } = await up.json();
      await fetch(`${API}/api/Profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.headers },
        body: JSON.stringify({ profilePictureUrl: url }),
      });
      setMe((m) => (m ? { ...m, profilePictureUrl: url } : m));
      setPicOpen(false);
      setFile(null);
      setPreview(null);
    } catch {
      setFlash({ ok: false, text: 'Upload failed.' });
    }
  };

  /* ─── logout ────────────────────────────────────────── */
  const logout = () => {
    localStorage.removeItem('token');
    nav('/login', { replace: true });
  };

  /* ─── JSX ───────────────────────────────────────────── */
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Profile settings</h1>

      {/* basic info */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Name</label>
          <input value={first} onChange={(e) => setFirst(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label>Surname</label>
          <input value={last} onChange={(e) => setLast(e.target.value)} required />
        </div>
      </div>

      <div className={styles.formCol}>
        <label>Email</label>
        <input value={mail} onChange={(e) => setMail(e.target.value)} required />
      </div>

      <button className={styles.linkBtn} onClick={() => setPwOpen(true)}>
        Change password
      </button>
      <button className={styles.linkBtn} onClick={() => setPicOpen(true)}>
        Change profile picture
      </button>

      <div className={styles.footer}>
        <button className={styles.cancelBtn} onClick={() => nav(-1)}>
          Cancel
        </button>
        <button className={styles.saveBtn} onClick={saveProfile}>
          Save changes
        </button>
      </div>

      {flash && (
        <p className={flash.ok ? styles.okMsg : styles.errMsg}>{flash.text}</p>
      )}

      {/* password modal */}
      <Modal open={pwOpen} onClose={() => setPwOpen(false)}>
        <h2 className={styles.modalTitle}>Change password</h2>
        <form onSubmit={changePw} className={styles.modalForm}>
          <label>Current password</label>
          <input name="current" type="password" required />
          <label>New password</label>
          <input name="new" type="password" required />
          <label>Repeat new password</label>
          <input name="confirm" type="password" required />
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setPwOpen(false)}
            >
              Cancel
            </button>
            <button className={styles.saveBtn}>Save changes</button>
          </div>
        </form>
      </Modal>

      {/* picture modal */}
      <Modal
        open={picOpen}
        onClose={() => {
          setPicOpen(false);
          setFile(null);
          setPreview(null);
        }}
      >
        <h2 className={styles.modalTitle}>Change profile picture</h2>
        <img
          className={styles.avatar}
          src={
            preview ??
            (me.profilePictureUrl ? `${API}${me.profilePictureUrl}` : '/placeholder.png')
          }
          alt="preview"
        />
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          hidden
          onChange={onSelect}
        />
        <label htmlFor="fileInput" className={styles.uploadBtn}>
          Upload new picture
        </label>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={() => setPicOpen(false)}>
            Cancel
          </button>
          <button className={styles.saveBtn} disabled={!file} onClick={savePic}>
            Save changes
          </button>
        </div>
      </Modal>

      {/* bottom buttons */}
      <div className={styles.bottomRow}>
        <button className={styles.logout} onClick={logout}>
          Log out
        </button>
        <button className={styles.logout} onClick={() => nav('/')}>
          Back to homepage
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
