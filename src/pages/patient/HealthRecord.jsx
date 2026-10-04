// FILE: src/pages/patient/HealthRecord.jsx
//
// Patient uploads past reports (PDF/photo). Doctors can only see these
// once a doctorPatients link exists (i.e. they've accepted a request
// from this patient at least once) — enforced by Firestore rules.

import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import {
  listenToPatientRecords, uploadPatientReport, getRecordFile, deletePatientRecord,
} from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

export default function PatientHealthRecord() {
  const { profile, firebaseUser } = useAuth();
  const [records, setRecords] = useState(null);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const [openFileId, setOpenFileId] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = listenToPatientRecords(
      firebaseUser.uid,
      (list) => { setError(null); setRecords(list); },
      (err) => setError(err.message || "Couldn't load your records.")
    );
    return unsub;
  }, [firebaseUser]);

  async function handleUpload() {
    setUploadError(null);
    if (!file) return setUploadError("Choose a file first.");
    setUploading(true);
    try {
      await uploadPatientReport({
        file, patientUid: firebaseUser.uid, patientName: profile?.name, patientId: profile?.specialId, title,
      });
      setTitle("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("uploadPatientReport failed:", err);
      setUploadError(err.message || "Couldn't upload this file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleViewFile(recordId) {
    setFileError(null);
    if (openFileId === recordId) {
      setOpenFileId(null);
      setFileUrl(null);
      return;
    }
    setOpenFileId(recordId);
    setFileUrl(null);
    setFileLoading(true);
    try {
      const url = await getRecordFile(recordId);
      setFileUrl(url);
    } catch (err) {
      setFileError(err.message || "Couldn't open this file.");
    } finally {
      setFileLoading(false);
    }
  }

  async function handleDelete(recordId) {
    setDeletingId(recordId);
    try {
      await deletePatientRecord(recordId);
      if (openFileId === recordId) {
        setOpenFileId(null);
        setFileUrl(null);
      }
    } catch (err) {
      console.error("deletePatientRecord failed:", err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout items={NAV.patient} roleLabel={ROLE_LABEL.patient}>
      <div className="page-head">
        <h1>My Health Record</h1>
        <p className="sub">Upload past reports so your doctor can see them during a consultation.</p>
      </div>

      <div className="panel">
        <h3>Upload a report</h3>
        <div className="field">
          <label>Title (optional)</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Blood test — Sept 2026" />
        </div>
        <div className="field">
          <label>File (PDF, JPG, PNG or WEBP)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        {uploadError && <p className="form-error">{uploadError}</p>}
        <button className="btn-primary" style={{ width: "auto", padding: "12px 26px" }} disabled={uploading} onClick={handleUpload}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      <div className="panel">
        <h3>Your reports</h3>
        {error && <p className="panel-note">Couldn't load your records: {error}</p>}
        {records === null && !error && <p className="panel-note">Loading…</p>}
        {records !== null && records.length === 0 && (
          <div className="empty-state">
            <div className="big">No reports uploaded yet</div>
            <p>Upload a report above to keep it with your record.</p>
          </div>
        )}

        {records?.map((r) => (
          <div key={r.id} className="medicine-result-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div className="medicine-result-name">{r.title}</div>
                <div className="panel-note">{r.fileName} · {Math.round((r.fileSize || 0) / 1024)} KB</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-primary" style={{ width: "auto", padding: "8px 18px" }} onClick={() => handleViewFile(r.id)}>
                  {openFileId === r.id ? "Hide" : "View"}
                </button>
                <button
                  className="btn-logout"
                  style={{ padding: "8px 18px" }}
                  disabled={deletingId === r.id}
                  onClick={() => handleDelete(r.id)}
                >
                  {deletingId === r.id ? "Removing…" : "Delete"}
                </button>
              </div>
            </div>
            {openFileId === r.id && (
              <div style={{ marginTop: 10 }}>
                {fileLoading && <p className="panel-note">Opening…</p>}
                {fileError && <p className="panel-note">{fileError}</p>}
                {fileUrl && r.fileType?.startsWith("image/") && (
                  <img src={fileUrl} alt={r.title} style={{ maxWidth: "100%", borderRadius: 8 }} />
                )}
                {fileUrl && r.fileType === "application/pdf" && (
                  <a href={fileUrl} download={r.fileName} className="btn-primary" style={{ display: "inline-block", width: "auto", padding: "8px 18px", textDecoration: "none" }}>
                    Download PDF
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}