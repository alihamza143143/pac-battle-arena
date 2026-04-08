class TeamManager {
  constructor(arena) {
    this.arena = arena;
  }

  joinTeam(pacman, giftType) {
    if (pacman.team) return false;
    if (giftType === 'rose') {
      pacman.joinTeam('pink');
    } else {
      pacman.joinTeam('blue');
    }
    return true;
  }

  joinTeamDirect(pacman, team) {
    if (pacman.team) return false;
    pacman.joinTeam(team);
    return true;
  }

  getTeamScores() {
    return {
      blue: this.arena.getTeamScore('blue'),
      pink: this.arena.getTeamScore('pink'),
    };
  }

  getTeamPlayerCounts() {
    return {
      blue: this.arena.getTeamPlayerCount('blue'),
      pink: this.arena.getTeamPlayerCount('pink'),
    };
  }
}

module.exports = TeamManager;
