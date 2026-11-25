"use client";

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useSyncExternalStore,
	type ReactNode,
} from "react";

const STORAGE_KEY = "swh_compare_projects";
const MAX_COMPARE_PROJECTS = 3;
let memorySnapshot: string | null = null;
const listeners = new Set<() => void>();

export interface CompareProject {
	id: number;
	name: string;
	slug: string;
}

interface CompareContextValue {
	projects: CompareProject[];
	isSelected: (id: number) => boolean;
	toggleProject: (project: CompareProject) => void;
	removeProject: (id: number) => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function notifyListeners() {
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	window.addEventListener("storage", handleStorageChange);
	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", handleStorageChange);
	};
}

function handleStorageChange(event: StorageEvent) {
	if (event.key === STORAGE_KEY || event.key === null) {
		notifyListeners();
	}
}

function getSnapshot() {
	try {
		return window.localStorage.getItem(STORAGE_KEY);
	} catch (error) {
		console.warn("Unable to load project comparison selection.", error);
		return memorySnapshot;
	}
}

function getServerSnapshot() {
	return null;
}

function parseProjects(snapshot: string | null): CompareProject[] {
	if (!snapshot) return [];

	try {
		const parsed: unknown = JSON.parse(snapshot);
		if (!Array.isArray(parsed)) {
			throw new Error("Stored comparison selection is not a list.");
		}

		const validProjects = parsed.filter(
			(project): project is CompareProject =>
				typeof project === "object" &&
				project !== null &&
				"id" in project &&
				typeof project.id === "number" &&
				Number.isInteger(project.id) &&
				"name" in project &&
				typeof project.name === "string" &&
				"slug" in project &&
				typeof project.slug === "string",
		);
		const uniqueProjects = validProjects.filter(
			(project, index, all) =>
				all.findIndex((candidate) => candidate.id === project.id) === index,
		);
		return uniqueProjects.slice(0, MAX_COMPARE_PROJECTS);
	} catch (error) {
		console.warn("Unable to parse project comparison selection.", error);
		return [];
	}
}

function updateStoredProjects(projects: CompareProject[]) {
	const snapshot = JSON.stringify(projects);
	memorySnapshot = snapshot;
	try {
		window.localStorage.setItem(STORAGE_KEY, snapshot);
	} catch (error) {
		console.warn("Unable to save project comparison selection.", error);
	}
	notifyListeners();
}

export function CompareProvider({ children }: { children: ReactNode }) {
	const snapshot = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	);
	const projects = useMemo(() => parseProjects(snapshot), [snapshot]);

	const updateProjects = useCallback((nextProjects: CompareProject[]) => {
		updateStoredProjects(nextProjects);
	}, []);

	const isSelected = useCallback(
		(id: number) => projects.some((project) => project.id === id),
		[projects],
	);

	const toggleProject = useCallback(
		(project: CompareProject) => {
			const alreadySelected = projects.some(
				(selected) => selected.id === project.id,
			);

			if (alreadySelected) {
				updateProjects(projects.filter((selected) => selected.id !== project.id));
				return;
			}

			if (projects.length < MAX_COMPARE_PROJECTS) {
				updateProjects([...projects, project]);
			}
		},
		[projects, updateProjects],
	);

	const removeProject = useCallback(
		(id: number) => {
			updateProjects(projects.filter((project) => project.id !== id));
		},
		[projects, updateProjects],
	);

	return (
		<CompareContext.Provider
			value={{ projects, isSelected, toggleProject, removeProject }}
		>
			{children}
		</CompareContext.Provider>
	);
}

export function useCompare() {
	const context = useContext(CompareContext);
	if (!context) {
		throw new Error("useCompare must be used within a CompareProvider.");
	}
	return context;
}
