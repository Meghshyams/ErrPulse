import type Database from "better-sqlite3";
import type { Project } from "@errlens/core";

interface ProjectRow {
  id: string;
  name: string;
  created_at: string;
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.name,
    name: row.name,
    createdAt: row.created_at,
  };
}

export class ProjectRepository {
  constructor(private db: Database.Database) {}

  findOrCreate(name: string): Project {
    const existing = this.db.prepare("SELECT * FROM projects WHERE name = ?").get(name) as
      | ProjectRow
      | undefined;

    if (existing) return rowToProject(existing);

    const now = new Date().toISOString();
    this.db
      .prepare("INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)")
      .run(name, name, now);

    return { id: name, name, createdAt: now };
  }

  findAll(): Project[] {
    const rows = this.db.prepare("SELECT * FROM projects ORDER BY name ASC").all() as ProjectRow[];
    return rows.map(rowToProject);
  }

  findById(id: string): Project | null {
    const row = this.db.prepare("SELECT * FROM projects WHERE name = ?").get(id) as
      | ProjectRow
      | undefined;
    return row ? rowToProject(row) : null;
  }
}
