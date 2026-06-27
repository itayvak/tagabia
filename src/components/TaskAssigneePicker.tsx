import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  FormControlLabel,
  FormGroup,
  IconButton,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
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
        items.push(`פלוגת ${formatPlatoonLabel(platoon)} (כל)`);
        continue;
      }

      for (const team of wholeTeams) {
        items.push(`צוות ${team} (כל)`);
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

  const targetCount = summaryItems.length;
  const hasSelection = assignedTeams.length > 0 || assignedUsers.length > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="subtitle2">שיוך לצוערים</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={isEntireBattalionSelected(selection)}
            onChange={(event) =>
              handleEntireBattalionChange(event.target.checked)
            }
            disabled={disabled}
          />
        }
        label="כל הגדוד"
      />

      {PLATOONS.map((platoon) => {
        const platoonTeams = getTeamsForPlatoon(platoon);
        const hasSelectionInPlatoon = hasPlatoonSelection(platoon);

        return (
          <Accordion
            key={platoon}
            disableGutters
            variant="outlined"
            disabled={disabled}
            sx={{
              "&:before": { display: "none" },
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: hasSelectionInPlatoon ? 600 : 400,
                  color: hasSelectionInPlatoon ? "text.primary" : "text.secondary",
                }}
              >
                פלוגת {formatPlatoonLabel(platoon)}
                {isPlatoonFullySelected(platoon) && <> · כל הפלוגה</>}
                {!isPlatoonFullySelected(platoon) && hasSelectionInPlatoon && (
                  <> · נבחרו צוותים</>
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isPlatoonFullySelected(platoon)}
                      indeterminate={isPlatoonPartiallySelected(platoon)}
                      onChange={(event) =>
                        handleEntirePlatoonChange(platoon, event.target.checked)
                      }
                      disabled={disabled}
                    />
                  }
                  label="כל הפלוגה"
                />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pr: 1 }}>
                  {platoonTeams.map((team) => {
                    const teamCheckbox = getTeamCheckboxState(team);
                    const isExpanded = expandedTeams.has(team);
                    const teamUsers = usersByTeam.get(team) ?? [];
                    const isLoadingTeam = loadingTeams.has(team);
                    const teamLoadError = loadErrors.get(team);

                    return (
                      <Box key={team}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={teamCheckbox.checked}
                            indeterminate={teamCheckbox.indeterminate}
                            onChange={(event) =>
                              handleWholeTeamChange(team, event.target.checked)
                            }
                            disabled={disabled || isPlatoonFullySelected(platoon)}
                          />
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            צוות {team}
                          </Typography>
                          <IconButton
                            size="small"
                            aria-label={
                              isExpanded ? "הסתר צוערים" : "הצג צוערים"
                            }
                            onClick={() => toggleTeamExpanded(team)}
                            disabled={disabled}
                          >
                            {isExpanded ? (
                              <KeyboardArrowUpIcon fontSize="small" />
                            ) : (
                              <KeyboardArrowDownIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Box>

                        <Collapse in={isExpanded}>
                          <Box sx={{ pr: 3, pt: 0.5, pb: 1 }}>
                            {isLoadingTeam && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
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
                              <Typography variant="caption" color="error">
                                {teamLoadError}
                              </Typography>
                            )}

                            {!isLoadingTeam &&
                              !teamLoadError &&
                              teamUsers.map((user) => (
                                <FormControlLabel
                                  key={user.id}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={isMemberChecked(team, user.id)}
                                      onChange={(event) =>
                                        handleMemberChange(
                                          team,
                                          user.id,
                                          event.target.checked,
                                        )
                                      }
                                      disabled={
                                        disabled ||
                                        isPlatoonFullySelected(platoon) ||
                                        assignedTeams.includes(team)
                                      }
                                    />
                                  }
                                  label={`${user.fullname} (${user.rank})`}
                                />
                              ))}

                            {!isLoadingTeam &&
                              !teamLoadError &&
                              teamUsers.length === 0 && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  אין צוערים בצוות
                                </Typography>
                              )}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Box>
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {!hasSelection
            ? "לא נבחרו צוותים או צוערים"
            : `${targetCount} קבוצות נבחרו`}
        </Typography>
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
