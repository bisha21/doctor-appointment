import { JOIN_WINDOW_MINUTES_BEFORE } from "@/lib/constants";

export function isWithinJoinWindow(startTime, endTime, now = new Date()) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const windowOpensAt = new Date(start.getTime() - JOIN_WINDOW_MINUTES_BEFORE * 60000);

    return now >= windowOpensAt && now <= end;
}
