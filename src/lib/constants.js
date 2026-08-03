export const APPOINTMENT_CREDIT_COST = 2;

// Cancel at least this many hours before the appointment to get a full credit refund.
export const CANCELLATION_REFUND_WINDOW_HOURS = 24;

// A "Join Call" action becomes available this many minutes before the appointment
// start time, and stays available until the appointment's end time.
export const JOIN_WINDOW_MINUTES_BEFORE = 15;

// Payout economics: each credit is worth $10 total. The platform keeps $2/credit
// as a fee; the doctor is paid out the remaining $8/credit.
export const PLATFORM_FEE_PER_CREDIT = 2;
export const DOCTOR_NET_PER_CREDIT = 8;

export const APPOINTMENT_STATUS_STYLES = {
    SCHEDULED: "bg-emerald-900/20 text-emerald-400 border-emerald-700/30",
    COMPLETED: "bg-blue-900/20 text-blue-400 border-blue-700/30",
    CANCELLED: "bg-red-900/20 text-red-400 border-red-700/30",
};
