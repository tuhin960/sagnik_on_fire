import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import StatusBadge from "../../components/common/StatusBadge";
import {
  getDoctorPatientAppointments, getConsultationsForDoctorPatient,
  getRecordsForPatient, getRecordFile, getIntake,
} from "../../firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { NAV, ROLE_LABEL } from "../../utils/navConfig";

const SEVERITY_BADGE = { mild: "normal", moderate: "urgent", severe: "emergency", unspecified: "normal" };

export default function DoctorPatientDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const [appointments, setAppointments] = useState(null);
  const [consultations, setConsultations] = useState(null);
  const [records, setRecords] = useState(null);
  const [intakes, setIntakes] = useState({});
  const [error, setError] = useState(null);
  const [openFileId, setOpenFileId] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileError, setFileError] = useState(null);

  useEffect(() => {
    if (!firebaseUser?.uid || !state?.patientUid) return;
    let cancelled = false;
    setError(null);

    Promise.all([
      getDoctorPatientAppointments(firebaseUser.uid, state.patientUid).catch(() => []),
      getConsultationsForDoctorPatient(firebaseUser.uid, state.patientUid).catch(() => []),
      getRecordsForPatient(state.patientUid).catch(() => []),
    ]).then(([apps, cons, recs]) => {
      if (cancelled) return;
      setAppointments(apps);
      setConsultations(cons);
      setRecords(recs);

      apps.forEach(async (app) => {
        if (app.hasIntake) {
          try {
            const intk = await getIntake(app.id);
            if (!cancelled && intk) {
              setIntakes((prev) => ({ ...prev, [app.id]: intk }));
            }
          } catch (e) { }
        }
      });
    });

    return () => { cancelled = true; };
  }, [firebaseUser, state]);

  const togglePreview = async (record) => {
    if (openFileId === record.id) {
      setOpenFileId(null);
      setFileUrl(null);
      return;
    }
    setOpenFileId(record.id);
    setFileUrl(null);
    setFileError(null);
    try {
      const dataUrl = await getRecordFile(record.id);
      setFileUrl(dataUrl);
    } catch (e) {
      setFileError("Could not load preview.");
    }
  };

  if (!state?.patientUid) {
    return (
      <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
        <div className="empty-state">
          <div className="big">No patient selected</div>
          <button className="btn-primary" onClick={() => navigate("/doctor/my-patients")}>Go back</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout items={NAV.doctor} roleLabel={ROLE_LABEL.doctor}>
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <button className="menu-btn" style={{ fontSize: 14, marginBottom: 8 }} onClick={() => navigate("/doctor/my-patients")}>
            ← Back to My Patients
          </button>
          <h1>{state.patientName}</h1>
          <p className="sub">ID: {state.patientId}</p>
        </div>
      </div>

      <div className="doctor-grid">
        <div className="doctor-col">
          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>Medical Records</h3>
            {records === null ? <p className="panel-note">Loading records...</p> : null}
            {records?.length === 0 ? <p className="panel-note">No records uploaded by this patient.</p> : null}
            {records?.map(rec => (
              <div key={rec.id} style={{ marginBottom: 16, border: "1px solid var(--border-light)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{rec.title}</div>
                    <div className="panel-note" style={{ fontSize: 12 }}>{new Date(rec.createdAt?.toMillis() || Date.now()).toLocaleDateString()}</div>
                  </div>
                  <button className="btn-secondary" style={{ padding: "4px 12px", fontSize: 13 }} onClick={() => togglePreview(rec)}>
                    {openFileId === rec.id ? "Close Preview" : "Preview"}
                  </button>
                </div>
                {openFileId === rec.id && (
                  <div style={{ padding: 16, borderTop: "1px solid var(--border-light)" }}>
                    {fileError && <p style={{ color: "red" }}>{fileError}</p>}
                    {!fileUrl && !fileError && <p>Loading preview...</p>}
                    {fileUrl && (
                      <div style={{ textAlign: "center" }}>
                        {fileUrl.startsWith("data:image") ? (
                          <img src={fileUrl} alt={rec.title} style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 4 }} />
                        ) : fileUrl.startsWith("data:application/pdf") ? (
                          <iframe src={fileUrl} style={{ width: "100%", height: 500, border: "none" }} title={rec.title} />
                        ) : (
                          <p>Preview not supported for this file type.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>Previous Sessions (Consultations)</h3>
            {consultations === null ? <p className="panel-note">Loading consultations...</p> : null}
            {consultations?.length === 0 ? <p className="panel-note">No previous consultations recorded.</p> : null}
            {consultations?.map(cons => (
              <div key={cons.id} style={{ marginBottom: 16, borderBottom: "1px solid var(--border-light)", paddingBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <strong>{cons.date}</strong>
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{cons.notes}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="doctor-col">
          <div className="panel">
            <h3 style={{ marginBottom: 16 }}>AI Intake Summaries</h3>
            {appointments === null ? <p className="panel-note">Loading...</p> : null}
            {appointments?.filter(a => a.hasIntake).length === 0 ? <p className="panel-note">No AI intake forms filled by this patient.</p> : null}
            {appointments?.filter(a => a.hasIntake).map(app => {
              const intk = intakes[app.id];
              return (
                <div key={app.id} style={{ marginBottom: 16, borderBottom: "1px solid var(--border-light)", paddingBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong>For appointment on {app.date}</strong>
                    {intk?.severity && <StatusBadge type={SEVERITY_BADGE[intk.severity.toLowerCase()] || "normal"} label={intk.severity} />}
                  </div>
                  {intk ? (
                    <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>{intk.summary}</div>
                  ) : (
                    <p className="panel-note">Loading summary...</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}