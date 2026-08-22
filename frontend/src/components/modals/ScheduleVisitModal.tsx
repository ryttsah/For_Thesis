import { IconCalendarCheck, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useDemoStore } from "../../context/DemoStoreContext";
import { isApiEnabled } from "../../services/api";
import { fetchOfficerBootstrap, scheduleVisitApi } from "../../services/domain";
import { SCHEDULE_FULLY_BOOKED_DATES } from "../../constants/demoData";
import { brgyMatches } from "../../hooks/useBarangayOptions";
import { useOfficerScope } from "../../hooks/useOfficerScope";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface ScheduleVisitModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ScheduleVisitModal({ open, onClose }: ScheduleVisitModalProps) {
  const { farms, bookedSlots, bookVisit, syncOfficerDomain } = useDemoStore();
  const { user } = useAuth();
  const { assignedBrgy, officerId } = useOfficerScope();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<"AM" | "PM" | null>(null);
  const [farm, setFarm] = useState("");
  const [bookError, setBookError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const scopedFarms = useMemo(
    () => (assignedBrgy ? farms.filter((f) => brgyMatches(f.brgy, assignedBrgy)) : []),
    [farms, assignedBrgy],
  );

  useEffect(() => {
    if (!open) return;
    setBookError(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    if (scopedFarms.length > 0) {
      setFarm(scopedFarms[0].name);
    } else {
      setFarm("");
    }
  }, [open, scopedFarms]);

  const calendar = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const dim = new Date(year, month + 1, 0).getDate();
    const cells: { day?: number; iso?: string; unavailable?: boolean }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({});
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    const afterSixToday = now.getHours() >= 18;
    for (let d = 1; d <= dim; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dt = new Date(year, month, d);
      const isToday =
        dt.getFullYear() === now.getFullYear() &&
        dt.getMonth() === now.getMonth() &&
        dt.getDate() === now.getDate();
      const unavailable =
        dt.getDay() === 0 ||
        SCHEDULE_FULLY_BOOKED_DATES.includes(iso) ||
        dt < today ||
        (isToday && afterSixToday);
      cells.push({ day: d, iso, unavailable });
    }
    return cells;
  }, [year, month]);

  function navMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m);
    setYear(y);
    setSelectedDate(null);
    setSelectedSlot(null);
  }

  const farmName = farm || scopedFarms[0]?.name || "";
  const canBook =
    Boolean(assignedBrgy) &&
    scopedFarms.length > 0 &&
    Boolean(farmName) &&
    Boolean(selectedDate) &&
    Boolean(selectedSlot);

  async function confirm() {
    setBookError(null);
    if (!selectedDate || !selectedSlot) {
      setBookError("Pick an open date and a time slot (Morning or Afternoon).");
      return;
    }
    if (!farmName) {
      setBookError("No farm available in your assigned barangay.");
      return;
    }
    const row = scopedFarms.find((f) => f.name === farmName);
    const brgy = row?.brgy ?? assignedBrgy;
    if (!brgy) {
      setBookError("Ask admin to assign you to the same barangay as this farm, then sign in again.");
      return;
    }
    const payload = {
      farm: farmName,
      owner: row?.owner ?? "Assigned farmer",
      brgy,
      date: selectedDate,
      slot: selectedSlot,
      scheduledBy: user?.displayName ?? officerId ?? "PCA Officer",
      purpose: "Registration and field validation",
    };

    setBooking(true);
    if (isApiEnabled()) {
      const result = await scheduleVisitApi(payload);
      setBooking(false);
      if (result.ok) {
        const data = await fetchOfficerBootstrap();
        if (data) syncOfficerDomain(data);
        onClose();
        alert("Visit booked. The farmer portal notification list has been updated.");
        return;
      }
      setBookError(result.message);
      return;
    }

    bookVisit(payload, { date: selectedDate, slot: selectedSlot });
    setBooking(false);
    onClose();
    alert("Visit booked. The farmer portal notification list has been updated.");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Schedule farm visit"
      description={
        <>
          Choose a farm in your assigned barangay, an open date, and a free time slot. The farmer
          receives an <strong>in-system</strong> notification immediately.
        </>
      }
      footer={
        <>
          <button type="button" className="btn-sec rounded-[10px] border-[1.5px] border-pca-border px-4 py-2 text-sm font-semibold" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canBook || booking}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-pca-green px-4 py-2 text-sm font-semibold text-white hover:bg-pca-green-hover disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void confirm()}
          >
            <IconCalendarCheck size={16} />
            {booking ? "Booking…" : "Book visit"}
          </button>
        </>
      }
    >
      {!assignedBrgy ? (
        <p className="mb-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[13px] text-orange-800">
          Your account has no assigned barangay. Ask admin to assign you under Officers, then log out and sign in again.
        </p>
      ) : null}
      <label className="mb-1.5 block text-[13px] font-semibold">Farm ({assignedBrgy})</label>
      {bookError && (
        <p className="mb-3 rounded-lg border border-pca-red-soft bg-pca-red-light px-3 py-2 text-[13px] text-pca-red" role="alert">
          {bookError}
        </p>
      )}
      <select
        value={farmName}
        onChange={(e) => setFarm(e.target.value)}
        disabled={scopedFarms.length === 0}
        className="mb-3.5 w-full rounded-lg border border-pca-border px-3 py-2.5 text-sm disabled:opacity-50"
      >
        {scopedFarms.length === 0 ? (
          <option value="">No farms in {assignedBrgy}</option>
        ) : (
          scopedFarms.map((f) => (
            <option key={f.name} value={f.name}>
              {f.name} — {f.owner}
            </option>
          ))
        )}
      </select>

      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => navMonth(-1)} className="rounded-lg border border-pca-border px-3 py-2">
          <IconChevronLeft size={16} />
        </button>
        <strong className="text-[15px]">{MONTHS[month]} {year}</strong>
        <button type="button" onClick={() => navMonth(1)} className="rounded-lg border border-pca-border px-3 py-2">
          <IconChevronRight size={16} />
        </button>
      </div>

      <div className="cal-grid mb-2 grid grid-cols-7 gap-1 text-center text-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="cal-dow py-1.5 font-bold text-pca-muted">{d}</div>
        ))}
        {calendar.map((cell, i) =>
          cell.day ? (
            <button
              key={i}
              type="button"
              disabled={cell.unavailable}
              onClick={() => cell.iso && setSelectedDate(cell.iso)}
              className={`cal-cell aspect-square max-h-10 rounded-lg text-sm font-semibold ${
                cell.unavailable
                  ? "cursor-not-allowed bg-pca-red-light text-pca-red line-through"
                  : selectedDate === cell.iso
                    ? "bg-pca-green text-white"
                    : "hover:bg-pca-green-light"
              }`}
            >
              {cell.day}
            </button>
          ) : (
            <div key={i} className="cal-cell out text-transparent">·</div>
          ),
        )}
      </div>
      <p className="mb-3 text-xs text-pca-muted">Gray dates are unavailable. Sundays are blocked for this demo.</p>

      <div className="slot-row flex flex-wrap gap-2">
        {!selectedDate ? (
          <span className="text-xs text-pca-muted">Select an open date first.</span>
        ) : (
          (["AM", "PM"] as const).map((slot) => {
            const taken = bookedSlots.some((b) => b.date === selectedDate && b.slot === slot);
            return (
              <button
                key={slot}
                type="button"
                disabled={taken}
                onClick={() => setSelectedSlot(slot)}
                className={`slot-btn rounded-lg border-[1.5px] px-3.5 py-2 text-[13px] font-semibold ${
                  taken
                    ? "cursor-not-allowed opacity-45 line-through"
                    : selectedSlot === slot
                      ? "border-pca-green bg-pca-green-light text-pca-green"
                      : "border-pca-border bg-white"
                }`}
              >
                {slot === "AM" ? "Morning | 8:00–11:30" : "Afternoon | 13:00–16:30"}
                {taken ? " (booked)" : ""}
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
