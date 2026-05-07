import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { mockData } from './data';

const ScopeContext = createContext(null);

export function ScopeProvider({ children }) {
  const [path, setPath] = useState([]);
  const [teleportedSegments, setTeleportedSegments] = useState(new Set());

  const currentEntity = path.at(-1) ?? null;
  const currentLevel = path.length === 0 ? 'root' : path.at(-1).type;
  const childEntities = currentEntity?.children ?? mockData;

  const navigate = useCallback((newPath) => {
    setPath(newPath);
  }, []);

  const drillDown = useCallback((entity) => {
    setPath(prev => [...prev, entity]);
  }, []);

  const teleport = useCallback((entity, fullPath) => {
    setPath(prev => [...prev, ...fullPath]);
    const filledIds = new Set(fullPath.map(e => e.id));
    setTeleportedSegments(filledIds);
    setTimeout(() => setTeleportedSegments(new Set()), 600);
  }, []);

  const value = useMemo(() => ({
    path,
    currentEntity,
    currentLevel,
    childEntities,
    teleportedSegments,
    navigate,
    drillDown,
    teleport,
  }), [path, currentEntity, currentLevel, childEntities, teleportedSegments, navigate, drillDown, teleport]);

  return (
    <ScopeContext.Provider value={value}>
      {children}
    </ScopeContext.Provider>
  );
}

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScope must be used within a ScopeProvider');
  return ctx;
}
