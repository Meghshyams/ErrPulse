import { computeFingerprint, type ErrLensEvent, type ErrorExplanation } from "@errlens/core";
import { ErrorRepository } from "../db/repositories/error-repository.js";
import { EventRepository } from "../db/repositories/event-repository.js";
import { ProjectRepository } from "../db/repositories/project-repository.js";
import { generateExplanation } from "./explanation.js";
import { broadcast } from "../ws/broadcaster.js";

export interface IngestResult {
  eventId: string;
  errorId: string;
  fingerprint: string;
  isNew: boolean;
}

export function ingestEvent(
  event: ErrLensEvent,
  errorRepo: ErrorRepository,
  eventRepo: EventRepository,
  projectRepo?: ProjectRepository
): IngestResult {
  // Auto-register project if projectId is present
  if (event.projectId && projectRepo) {
    projectRepo.findOrCreate(event.projectId);
  }

  const fingerprint = event.fingerprint ?? computeFingerprint(event);
  const explanation = generateExplanation(event.message);

  const { errorId, isNew } = errorRepo.upsert(
    fingerprint,
    event.type,
    event.message,
    event.source,
    event.severity,
    explanation,
    event.eventId,
    event.timestamp,
    event.projectId
  );

  eventRepo.insert(event, errorId, fingerprint);

  // Broadcast to dashboard
  const errorGroup = errorRepo.findById(errorId);
  if (isNew && errorGroup) {
    broadcast({ type: "new_error", payload: errorGroup });
  } else if (errorGroup) {
    broadcast({ type: "new_event", payload: { errorGroup, event } });
  }

  return {
    eventId: event.eventId,
    errorId,
    fingerprint,
    isNew,
  };
}
