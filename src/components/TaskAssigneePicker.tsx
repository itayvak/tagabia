import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { fetchUsersByIds } from "@/lib/fetchUsersByIds";
import { fetchUsersByTeams } from "@/lib/fetchUsersByTeams";
import {
  selectionToTeamIds,
  teamIdsToSelection,
} from "@/lib/assigneeTeams";
import {
  PLATOONS,
  createEntireBattalionSelection,
  formatPlatoonLabel,
  getTeamsForPlatoon,
  isEntireBattalionSelected,
} from "@/lib/platoons";
import type { Platoon, PublicUser } from "@/types/user";

function formatTeamHierarchyLabel(platoon: Platoon, team: number): string {
  const platoonTeams = getTeamsForPlatoon(platoon);
  const localIndex = platoonTeams.indexOf(team) + 1;
  return `צוות ${localIndex}`;
}

const hierarchyLineSx = {
  width: 2,
  bgcolor: "divider",
  borderRadius: 1,
  alignSelf: "stretch",
  flexShrink: 0,
  minHeight: 20,
} as const;

function HierarchyGuide({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "stretch" }}>
      <Box sx={hierarchyLineSx} aria-hidden />
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

interface AssigneeSelectionRowProps {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onCheckedChange: (checked: boolean) => void;
  onToggleExpand?: () => void;
  stopExpandPropagation?: boolean;
}

function AssigneeSelectionRow({
  label,
  checked,
  indeterminate = false,
  disabled = false,
  highlighted = false,
  expandable = false,
  expanded = false,
  onCheckedChange,
  onToggleExpand,
  stopExpandPropagation = false,
}: AssigneeSelectionRowProps) {
  const handleToggleExpand = () => {
    if (!disabled && expandable) {
      onToggleExpand?.();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        width: "100%",
        minHeight: 36,
      }}
    >
      <Checkbox
        size="small"
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        onClick={
          stopExpandPropagation
            ? (event) => event.stopPropagation()
            : undefined
        }
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          fontWeight: highlighted ? 600 : 400,
          color: highlighted ? "text.primary" : "text.secondary",
          cursor: expandable && !disabled ? "pointer" : "default",
        }}
        onClick={handleToggleExpand}
      >
        {label}
      </Typography>
      {expandable ? (
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            color: "text.secondary",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            cursor: disabled ? "default" : "pointer",
          }}
          onClick={handleToggleExpand}
        />
      ) : (
        <Box sx={{ width: 20, flexShrink: 0 }} aria-hidden />
      )}
    </Box>
  );
}

export interface TaskAssignment {
  assignedTeams: number[];
  assignedUsers: string[];
}

interface TaskAssigneePickerProps {
  assignedTeams: number[];
  assignedUsers: string[];
  onChange: (assignment: TaskAssignment) => void;
  disabled?: boolean;
}

function cacheUsersByTeam(
  users: PublicUser[],
  cache: Map<number, PublicUser[]>,
): Map<number, PublicUser[]> {
  const next = new Map(cache);

  for (const user of users) {
    const teamUsers = next.get(user.team) ?? [];
    if (!teamUsers.some((entry) => entry.id === user.id)) {
      next.set(user.team, [...teamUsers, user]);
    }
  }

  return next;
}

function removeUsersFromTeam(
  assignedUsers: string[],
  teamUsers: PublicUser[],
): string[] {
  const teamUserIds = new Set(teamUsers.map((user) => user.id));
  return assignedUsers.filter((userId) => !teamUserIds.has(userId));
}

export default function TaskAssigneePicker({
  assignedTeams,
  assignedUsers,
  onChange,
  disabled = false,
}: TaskAssigneePickerProps) {
  const [usersByTeam, setUsersByTeam] = useState<Map<number, PublicUser[]>>(
    new Map(),
  );
  const [loadingTeams, setLoadingTeams] = useState<Set<number>>(new Set());
  const [loadErrors, setLoadErrors] = useState<Map<number, string>>(new Map());
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());
  const [expandedPlatoons, setExpandedPlatoons] = useState<Set<Platoon>>(
    new Set(),
  );

  const assignedUsersKey = assignedUsers.join(",");

  useEffect(() => {
    if (assignedUsers.length === 0) {
      return;
    }

    let cancelled = false;

    const hydrateAssignedUsers = async () => {
      const { response, data } = await fetchUsersByIds(assignedUsers);

      if (cancelled || !response.ok) {
        return;
      }

      const users = "users" in data ? data.users : [];
      setUsersByTeam((current) => cacheUsersByTeam(users, current));
    };

    void hydrateAssignedUsers();

    return () => {
      cancelled = true;
    };
  }, [assignedUsersKey]);

  const loadTeamUsers = useCallback(async (teamId: number) => {
    setLoadingTeams((current) => {
      if (current.has(teamId)) {
        return current;
      }

      return new Set(current).add(teamId);
    });

    setLoadErrors((current) => {
      const next = new Map(current);
      next.delete(teamId);
      return next;
    });

    try {
      const { response, data } = await fetchUsersByTeams([teamId]);

      if (!response.ok) {
        setLoadErrors((current) =>
          new Map(current).set(teamId, "טעינת הצוערים נכשלה"),
        );
        return;
      }

      const users = "users" in data ? data.users : [];
      setUsersByTeam((current) => {
        if ((current.get(teamId) ?? []).length > 0) {
          return current;
        }

        return cacheUsersByTeam(users, current);
      });
    } catch {
      setLoadErrors((current) =>
        new Map(current).set(teamId, "שגיאה בטעינת הצוערים"),
      );
    } finally {
      setLoadingTeams((current) => {
        const next = new Set(current);
        next.delete(teamId);
        return next;
      });
    }
  }, []);

  const toggleTeamExpanded = (teamId: number) => {
    const willExpand = !expandedTeams.has(teamId);

    setExpandedTeams((current) => {
      const next = new Set(current);
      if (willExpand) {
        next.add(teamId);
      } else {
        next.delete(teamId);
      }
      return next;
    });

    if (willExpand) {
      void loadTeamUsers(teamId);
    }
  };

  const togglePlatoonExpanded = (platoon: Platoon) => {
    setExpandedPlatoons((current) => {
      const next = new Set(current);
      if (next.has(platoon)) {
        next.delete(platoon);
      } else {
        next.add(platoon);
      }
      return next;
    });
  };

  const updateAssignment = (nextTeams: number[], nextUsers: string[]) => {
    onChange({
      assignedTeams: [...new Set(nextTeams)].sort((a, b) => a - b),
      assignedUsers: [...new Set(nextUsers)].sort((a, b) => a.localeCompare(b)),
    });
  };

  const handleWholeTeamChange = (teamId: number, checked: boolean) => {
    const teamUsers = usersByTeam.get(teamId) ?? [];

    if (checked) {
      updateAssignment(
        [...assignedTeams, teamId],
        removeUsersFromTeam(assignedUsers, teamUsers),
      );
      return;
    }

    updateAssignment(
      assignedTeams.filter((team) => team !== teamId),
      removeUsersFromTeam(assignedUsers, teamUsers),
    );
  };

  const handleMemberChange = (
    teamId: number,
    userId: string,
    checked: boolean,
  ) => {
    const teamUsers = usersByTeam.get(teamId) ?? [];

    if (assignedTeams.includes(teamId)) {
      if (!checked) {
        const otherMemberIds = teamUsers
          .filter((user) => user.id !== userId)
          .map((user) => user.id);

        updateAssignment(
          assignedTeams.filter((team) => team !== teamId),
          [
            ...removeUsersFromTeam(assignedUsers, teamUsers),
            ...otherMemberIds,
          ],
        );
      }
      return;
    }

    if (checked) {
      const nextUsers = [...assignedUsers, userId];
      const allMemberIds = teamUsers.map((user) => user.id);
      const allSelected =
        teamUsers.length > 0 &&
        allMemberIds.every((id) => nextUsers.includes(id));

      if (allSelected) {
        updateAssignment(
          [...assignedTeams, teamId],
          removeUsersFromTeam(nextUsers, teamUsers),
        );
        return;
      }

      updateAssignment(assignedTeams, nextUsers);
      return;
    }

    updateAssignment(
      assignedTeams,
      assignedUsers.filter((id) => id !== userId),
    );
  };

  const getTeamCheckboxState = (teamId: number) => {
    if (assignedTeams.includes(teamId)) {
      return { checked: true, indeterminate: false };
    }

    const teamUsers = usersByTeam.get(teamId) ?? [];
    const selectedCount = assignedUsers.filter((userId) =>
      teamUsers.some((user) => user.id === userId),
    ).length;

    if (selectedCount === 0) {
      const hasUnknownSelections = assignedUsers.some((userId) => {
        const cachedUser = [...usersByTeam.values()]
          .flat()
          .find((user) => user.id === userId);
        return cachedUser?.team === teamId;
      });

      return {
        checked: false,
        indeterminate: hasUnknownSelections,
      };
    }

    return {
      checked: false,
      indeterminate: selectedCount < teamUsers.length || teamUsers.length === 0,
    };
  };

  const isMemberChecked = (teamId: number, userId: string) => {
    if (assignedTeams.includes(teamId)) {
      return true;
    }

    return assignedUsers.includes(userId);
  };

  const selection = useMemo(() => teamIdsToSelection(assignedTeams), [assignedTeams]);

  const handleEntireBattalionChange = (checked: boolean) => {
    if (!checked) {
      updateAssignment([], []);
      return;
    }

    const battalionTeams = selectionToTeamIds(createEntireBattalionSelection());
    updateAssignment(battalionTeams, []);
  };

  const handleEntirePlatoonChange = (platoon: Platoon, checked: boolean) => {
    const platoonTeams = getTeamsForPlatoon(platoon);
    const platoonUsers = platoonTeams.flatMap(
      (team) => usersByTeam.get(team) ?? [],
    );

    if (checked) {
      updateAssignment(
        [...new Set([...assignedTeams, ...platoonTeams])],
        removeUsersFromTeam(assignedUsers, platoonUsers),
      );
      return;
    }

    updateAssignment(
      assignedTeams.filter((team) => !platoonTeams.includes(team)),
      removeUsersFromTeam(assignedUsers, platoonUsers),
    );
  };

  const isPlatoonFullySelected = (platoon: Platoon) => {
    const platoonTeams = getTeamsForPlatoon(platoon);
    return platoonTeams.every((team) => assignedTeams.includes(team));
  };

  const isPlatoonPartiallySelected = (platoon: Platoon) => {
    const platoonTeams = getTeamsForPlatoon(platoon);
    const hasWholeTeam = platoonTeams.some((team) => assignedTeams.includes(team));
    const hasPartialMembers = platoonTeams.some((team) => {
      const teamUsers = usersByTeam.get(team) ?? [];
      return assignedUsers.some((userId) =>
        teamUsers.some((user) => user.id === userId),
      );
    });

    return (hasWholeTeam || hasPartialMembers) && !isPlatoonFullySelected(platoon);
  };

  const hasPlatoonSelection = (platoon: Platoon) => {
    const platoonTeams = getTeamsForPlatoon(platoon);
    return (
      platoonTeams.some((team) => assignedTeams.includes(team)) ||
      platoonTeams.some((team) => {
        const teamUsers = usersByTeam.get(team) ?? [];
        return assignedUsers.some((userId) =>
          teamUsers.some((user) => user.id === userId),
        );
      })
    );
  };

  const summaryItems = useMemo(() => {
    const items: string[] = [];

    for (const platoon of PLATOONS) {
      const platoonTeams = getTeamsForPlatoon(platoon);
      const wholeTeams = platoonTeams.filter((team) =>
        assignedTeams.includes(team),
      );
      const partialTeams = platoonTeams.filter((team) => {
        if (assignedTeams.includes(team)) {
          return false;
        }

        const teamUsers = usersByTeam.get(team) ?? [];
        const selectedCount = assignedUsers.filter((userId) =>
          teamUsers.some((user) => user.id === userId),
        ).length;

        return selectedCount > 0;
      });

      if (wholeTeams.length === platoonTeams.length) {
        items.push(`פלוגת ${formatPlatoonLabel(platoon)} (כל הצוותים)`);
        continue;
      }

      for (const team of wholeTeams) {
        items.push(`צוות ${team} (כל הצוערים)`);
      }

      for (const team of partialTeams) {
        const teamUsers = usersByTeam.get(team) ?? [];
        const selectedCount = assignedUsers.filter((userId) =>
          teamUsers.some((user) => user.id === userId),
        ).length;
        items.push(`צוות ${team} (${selectedCount} צוערים)`);
      }
    }

    return items;
  }, [assignedTeams, assignedUsers, usersByTeam]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="subtitle2">שיוך לצוערים</Typography>

      <AssigneeSelectionRow
        label="כל הגדוד"
        checked={isEntireBattalionSelected(selection)}
        highlighted={isEntireBattalionSelected(selection)}
        disabled={disabled}
        onCheckedChange={handleEntireBattalionChange}
      />

      {PLATOONS.map((platoon) => {
        const platoonTeams = getTeamsForPlatoon(platoon);
        const hasSelectionInPlatoon = hasPlatoonSelection(platoon);
        const isPlatoonExpanded = expandedPlatoons.has(platoon);

        return (
          <Accordion
            key={platoon}
            disableGutters
            variant="outlined"
            expanded={isPlatoonExpanded}
            onChange={(_event, isExpanded) => {
              setExpandedPlatoons((current) => {
                const next = new Set(current);
                if (isExpanded) {
                  next.add(platoon);
                } else {
                  next.delete(platoon);
                }
                return next;
              });
            }}
            disabled={disabled}
            sx={{
              "&:before": { display: "none" },
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <AccordionSummary expandIcon={null} sx={{ minHeight: 48 }}>
              <AssigneeSelectionRow
                label={`פלוגת ${formatPlatoonLabel(platoon)}`}
                checked={isPlatoonFullySelected(platoon)}
                indeterminate={isPlatoonPartiallySelected(platoon)}
                highlighted={hasSelectionInPlatoon}
                expandable
                expanded={isPlatoonExpanded}
                disabled={disabled}
                stopExpandPropagation
                onCheckedChange={(checked) =>
                  handleEntirePlatoonChange(platoon, checked)
                }
                onToggleExpand={() => togglePlatoonExpanded(platoon)}
              />
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
              <HierarchyGuide>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  {platoonTeams.map((team) => {
                    const teamCheckbox = getTeamCheckboxState(team);
                    const isTeamExpanded = expandedTeams.has(team);
                    const teamUsers = usersByTeam.get(team) ?? [];
                    const isLoadingTeam = loadingTeams.has(team);
                    const teamLoadError = loadErrors.get(team);
                    const isTeamHighlighted =
                      teamCheckbox.checked || teamCheckbox.indeterminate;

                    return (
                      <Box key={team}>
                        <AssigneeSelectionRow
                          label={formatTeamHierarchyLabel(platoon, team)}
                          checked={teamCheckbox.checked}
                          indeterminate={teamCheckbox.indeterminate}
                          highlighted={isTeamHighlighted}
                          expandable
                          expanded={isTeamExpanded}
                          disabled={disabled || isPlatoonFullySelected(platoon)}
                          onCheckedChange={(checked) =>
                            handleWholeTeamChange(team, checked)
                          }
                          onToggleExpand={() => toggleTeamExpanded(team)}
                        />

                        <Collapse in={isTeamExpanded}>
                          <HierarchyGuide>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0,
                                py: 0.5,
                              }}
                            >
                              {isLoadingTeam && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    py: 0.5,
                                    minHeight: 36,
                                  }}
                                >
                                  <CircularProgress size={16} />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    טוען צוערים...
                                  </Typography>
                                </Box>
                              )}

                              {teamLoadError && (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  sx={{ py: 0.5, minHeight: 36 }}
                                >
                                  {teamLoadError}
                                </Typography>
                              )}

                              {!isLoadingTeam &&
                                !teamLoadError &&
                                teamUsers.map((user) => (
                                  <AssigneeSelectionRow
                                    key={user.id}
                                    label={user.fullname}
                                    checked={isMemberChecked(team, user.id)}
                                    highlighted={isMemberChecked(team, user.id)}
                                    disabled={
                                      disabled ||
                                      isPlatoonFullySelected(platoon) ||
                                      assignedTeams.includes(team)
                                    }
                                    onCheckedChange={(checked) =>
                                      handleMemberChange(
                                        team,
                                        user.id,
                                        checked,
                                      )
                                    }
                                  />
                                ))}

                              {!isLoadingTeam &&
                                !teamLoadError &&
                                teamUsers.length === 0 && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ py: 0.5, minHeight: 36 }}
                                  >
                                    אין צוערים בצוות
                                  </Typography>
                                )}
                            </Box>
                          </HierarchyGuide>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Box>
              </HierarchyGuide>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {summaryItems.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {summaryItems.map((item) => (
              <Chip key={item} label={item} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
