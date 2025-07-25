<template>
  <div class="qualification-manager">
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      Loading qualification data...
    </div>
    
    <div v-else class="qualification-content">

      <!-- Confederation Tabs -->
      <div class="confederation-tabs">
        <button 
          @click="activeConfederation = 'all'"
          :class="['tab-button', { active: activeConfederation === 'all' }]"
          :style="{ '--conf-color': '#2c3e50' }"
        >
          <span class="tab-flag">🌍</span>
          <span class="tab-name">All Confederations</span>
        </button>
        <button 
          v-for="confederation in confederations" 
          :key="confederation.id"
          @click="activeConfederation = confederation.id"
          :class="['tab-button', { active: activeConfederation === confederation.id }]"
          :style="{ '--conf-color': confederation.color }"
        >
          <span class="tab-flag">{{ confederation.flag }}</span>
          <span class="tab-name">{{ confederation.name }}</span>
          <span class="tab-slots">{{ Math.floor(confederation.qualificationSlots) }} slots</span>
        </button>
      </div>

      <!-- Finalization Status Box - Always Visible -->
      <div v-if="qualificationStarted && (allQualificationComplete || qualificationFinalized)" class="finalization-status-box">
        <div v-if="!qualificationFinalized" class="finalization-ready">
          <div class="status-icon">
            <i class="fas fa-trophy"></i>
          </div>
          <div class="status-content">
            <h4>Qualification Complete!</h4>
            <p>All confederations have finished their qualification process. Ready to start the tournament.</p>
            <button 
              @click="finalizeQualification"
              :disabled="finalizing"
              class="btn-finalize"
            >
              <i v-if="finalizing" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-rocket"></i>
              {{ finalizing ? 'Finalizing...' : 'Start World Cup Tournament' }}
            </button>
          </div>
        </div>
        
        <div v-else class="finalization-complete">
          <div class="status-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="status-content">
            <h4>Tournament Ready!</h4>
            <p>{{ allQualifiedTeams.length }} teams have qualified for the World Cup.</p>
            <button 
              @click="goToTournament" 
              :disabled="finalizing"
              class="btn-go-tournament"
            >
              <i v-if="finalizing" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-arrow-right"></i>
              {{ finalizing ? 'Preparing...' : 'GO TO TOURNAMENT' }}
            </button>
          </div>
        </div>
      </div>

      <!-- All Confederations View -->
      <div v-if="activeConfederation === 'all'" class="all-confederations-content">
        <!-- Show matchday selector only if not viewing playoffs -->
        <div v-if="!showAllConfederationsPlayoffs" class="matchday-selector">
          <button 
            @click="allConfederationsMatchday = Math.max(1, allConfederationsMatchday - 1)"
            :disabled="allConfederationsMatchday <= 1"
            class="matchday-nav"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <h3>Matchday {{ allConfederationsMatchday }}</h3>
          <button 
            @click="allConfederationsMatchday = allConfederationsMatchday + 1"
            :disabled="allConfederationsMatchday >= getMaxMatchday() && !areAllGroupMatchesComplete()"
            class="matchday-nav"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
          <button 
            v-if="areAllGroupMatchesComplete()"
            @click="showAllConfederationsPlayoffs = true"
            class="matchday-nav playoffs-btn"
          >
            <i class="fas fa-medal"></i>
            Playoffs
          </button>
        </div>
        
        <!-- Playoffs selector -->
        <div v-else class="matchday-selector">
          <button 
            @click="showAllConfederationsPlayoffs = false"
            class="matchday-nav"
          >
            <i class="fas fa-chevron-left"></i>
            Back to Matchdays
          </button>
          <h3><i class="fas fa-medal"></i> Playoffs</h3>
        </div>

        <!-- Matchday actions (only show for matchdays, not playoffs) -->
        <div v-if="!showAllConfederationsPlayoffs" class="all-matches-actions">
          <button 
            v-if="!simulatingAllMatchday"
            @click="simulateAllMatchdayMatches"
            :disabled="!hasUnplayedMatchesInMatchday(allConfederationsMatchday)"
            class="btn-primary"
          >
            <i class="fas fa-play"></i>
            {{ `Simulate All Matchday ${allConfederationsMatchday} Matches` }}
          </button>
          
          <div v-if="simulatingAllMatchday" class="simulation-controls">
            <button 
              @click="pauseSimulation"
              :disabled="simulationPaused"
              class="btn-secondary"
            >
              <i class="fas fa-pause"></i>
              Pause
            </button>
            <button 
              v-if="simulationPaused"
              @click="resumeSimulation"
              class="btn-primary"
            >
              <i class="fas fa-play"></i>
              Resume
            </button>
            <button 
              @click="toggleFastMode"
              :class="['btn-small', fastMode ? 'btn-success' : 'btn-secondary']"
              :title="fastMode ? 'Fast Mode ON' : 'Fast Mode OFF'"
            >
              <i class="fas fa-fast-forward"></i>
              {{ fastMode ? 'Fast' : 'Normal' }}
            </button>
            <div class="simulation-status">
              <i class="fas fa-spinner fa-spin simulation-spinner"></i>
              {{ getSimulationProgressText() }}
            </div>
          </div>
          
          <!-- Progress indicator -->
          <div v-if="simulatingAllMatchday && simulationProgress.total > 0" class="simulation-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: (simulationProgress.completed / simulationProgress.total * 100) + '%' }"
              ></div>
            </div>
            <div class="progress-text">
              {{ simulationProgress.completed }} / {{ simulationProgress.total }} matches
              <div v-if="simulationProgress.currentMatch" class="current-match">
                <span class="match-teams">
                  <span class="team">
                    <span class="team-flag">{{ simulationProgress.currentMatch.homeFlag }}</span>
                    {{ simulationProgress.currentMatch.homeTeam }}
                  </span>
                  <span v-if="!simulationProgress.lastResult" class="vs">vs</span>
                  <span v-else class="result-in-vs">{{ simulationProgress.lastResult }}</span>
                  <span class="team">
                    {{ simulationProgress.currentMatch.awayTeam }}
                    <span class="team-flag">{{ simulationProgress.currentMatch.awayFlag }}</span>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Playoff actions -->
        <div v-if="showAllConfederationsPlayoffs" class="all-matches-actions">
          <button 
            @click="simulateAllPlayoffMatches"
            :disabled="simulatingAllPlayoffs || !hasUnplayedPlayoffMatches()"
            class="btn-primary"
          >
            <i v-if="simulatingAllPlayoffs" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-play"></i>
            {{ simulatingAllPlayoffs ? 'Simulating...' : 'Simulate All Playoff Matches' }}
          </button>
        </div>

        <!-- Show playoff matches or regular matches -->
        <div v-if="showAllConfederationsPlayoffs" class="confederations-matches">
          <div v-for="conf in getConfederationsWithPlayoffs()" 
               :key="conf.id" 
               class="confederation-matches-section"
          >
            <h4 class="confederation-header">
              <span>{{ conf.flag }}</span>
              {{ conf.name }} Playoffs
              <span class="match-count">({{ conf.playoffMatches.length }} matches)</span>
            </h4>
            <div class="playoff-ties-container">
              <div 
                v-for="tie in conf.playoffTies" 
                :key="tie.id" 
                class="playoff-tie-card"
                :class="{ 'tie-completed': tie.completed }"
              >
                <div class="tie-header">
                  <span class="tie-label">{{ tie.name }}</span>
                  <span class="tie-status">
                    {{ tie.completed ? 'Completed' : 'In Progress' }}
                  </span>
                </div>
                
                <div class="tie-teams">
                  <div class="tie-team">
                    <span class="team-flag">{{ tie.team1.flag }}</span>
                    <router-link 
                      :to="`/tournament/${tournament._id}/qualifying-team/${tie.team1.teamId}`" 
                      class="team-name clickable-team"
                      @mouseenter="showTooltip($event, tie.team1.teamId)"
                      @mouseleave="hideTooltip"
                    >
                      {{ tie.team1.name }}
                    </router-link>
                  </div>
                  
                  <div class="vs-section">vs</div>
                  
                  <div class="tie-team">
                    <router-link 
                      :to="`/tournament/${tournament._id}/qualifying-team/${tie.team2.teamId}`" 
                      class="team-name clickable-team"
                      @mouseenter="showTooltip($event, tie.team2.teamId)"
                      @mouseleave="hideTooltip"
                    >
                      {{ tie.team2.name }}
                    </router-link>
                    <span class="team-flag">{{ tie.team2.flag }}</span>
                  </div>
                </div>
                
                <div class="tie-legs">
                  <div class="leg">
                    <div class="leg-header">1st Leg (at {{ tie.team1.name }})</div>
                    <div class="leg-match-display">
                      <div v-if="tie.firstLeg.played" class="leg-result">
                        <div class="leg-team home-team">
                          <span class="team-flag">{{ tie.team1.flag }}</span>
                          <span class="team-name">{{ tie.team1.name }}</span>
                          <span class="team-score">{{ tie.firstLeg.homeScore }}</span>
                        </div>
                        <div class="score-separator">-</div>
                        <div class="leg-team away-team">
                          <span class="team-score">{{ tie.firstLeg.awayScore }}</span>
                          <span class="team-name">{{ tie.team2.name }}</span>
                          <span class="team-flag">{{ tie.team2.flag }}</span>
                        </div>
                      </div>
                      <button 
                        v-else
                        @click="simulatePlayoffMatchInAllView(tie.firstLeg.matchId)"
                        :disabled="simulatingPlayoffMatch === tie.firstLeg.matchId"
                        class="btn-simulate-small"
                      >
                        <i v-if="simulatingPlayoffMatch === tie.firstLeg.matchId" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-play"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div class="leg">
                    <div class="leg-header">2nd Leg (at {{ tie.team2.name }})</div>
                    <div class="leg-match-display">
                      <div v-if="tie.secondLeg.played" class="leg-result">
                        <div class="leg-team home-team">
                          <span class="team-flag">{{ tie.team2.flag }}</span>
                          <span class="team-name">{{ tie.team2.name }}</span>
                          <span class="team-score">{{ tie.secondLeg.homeScore }}</span>
                        </div>
                        <div class="score-separator">-</div>
                        <div class="leg-team away-team">
                          <span class="team-score">{{ tie.secondLeg.awayScore }}</span>
                          <span class="team-name">{{ tie.team1.name }}</span>
                          <span class="team-flag">{{ tie.team1.flag }}</span>
                        </div>
                      </div>
                      <button 
                        v-else
                        @click="simulatePlayoffMatchInAllView(tie.secondLeg.matchId)"
                        :disabled="simulatingPlayoffMatch === tie.secondLeg.matchId"
                        class="btn-simulate-small"
                      >
                        <i v-if="simulatingPlayoffMatch === tie.secondLeg.matchId" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-play"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div v-if="tie.winner" class="tie-winner">
                  <i class="fas fa-arrow-right"></i>
                  <span class="winner-flag">{{ tie.winner.flag }}</span>
                  <span class="winner-name">{{ tie.winner.name }}</span>
                  <span class="progresses">progresses</span>
                </div>
              </div>
            </div>
            
            <!-- Show playoff winner if available -->
            <div v-if="conf.playoffWinner" class="playoff-winner">
              <div class="winner-header">
                <h5>
                  <i class="fas fa-trophy"></i>
                  Playoff Winner
                </h5>
              </div>
              <div class="winner-team">
                <span class="team-flag">{{ conf.playoffWinner.flag }}</span>
                <span class="team-name">{{ conf.playoffWinner.name }}</span>
                <span class="qualification-badge">World Cup Qualified</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Show regular matches -->
        <div v-else class="confederations-matches">
          <div v-for="conf in getConfederationsWithMatchesInMatchday(allConfederationsMatchday)" 
               :key="conf.id" 
               class="confederation-matches-section"
          >
            <h4 class="confederation-header">
              <span>{{ conf.flag }}</span>
              {{ conf.name }}
              <span class="match-count">({{ conf.matches.length }} matches)</span>
            </h4>
            <div class="qual-matches-grid">
              <div 
                v-for="match in conf.matches" 
                :key="match.matchId" 
                class="qual-match-card"
                :class="{ 'match-completed': match.played }"
              >
                <div class="qual-match-header">
                  <span class="group-label">{{ match.group }}</span>
                  <span class="match-status">
                    {{ match.played ? 'Completed' : 'Scheduled' }}
                  </span>
                </div>
                
                <div class="qual-match-teams">
                  <div class="team home-team">
                    <div class="team-flag">{{ match.homeTeam.flag }}</div>
                    <router-link 
                      :to="`/tournament/${tournament._id}/qualifying-team/${match.homeTeam.teamId}`" 
                      class="team-name clickable-team"
                      @mouseenter="showTooltip($event, match.homeTeam.teamId)"
                      @mouseleave="hideTooltip"
                    >
                      {{ match.homeTeam.name }}
                    </router-link>
                  </div>
                  
                  <div class="qual-match-score">
                    <div class="score-display">
                      <span class="home-score">{{ match.played ? match.homeScore : '-' }}</span>
                      <span class="score-separator">:</span>
                      <span class="away-score">{{ match.played ? match.awayScore : '-' }}</span>
                    </div>
                    <div class="match-actions">
                      <button 
                        v-if="!match.played"
                        @click="simulateMatch(match.matchId)"
                        :disabled="simulatingMatch === match.matchId"
                        class="btn-small simulate-btn"
                      >
                        <i v-if="simulatingMatch === match.matchId" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-play"></i>
                      </button>
                      <button 
                        @click="showMatchDetail(match)"
                        class="btn-small detail-btn"
                      >
                        <i class="fas fa-eye"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div class="team away-team">
                    <div class="team-flag">{{ match.awayTeam.flag }}</div>
                    <router-link 
                      :to="`/tournament/${tournament._id}/qualifying-team/${match.awayTeam.teamId}`" 
                      class="team-name clickable-team"
                      @mouseenter="showTooltip($event, match.awayTeam.teamId)"
                      @mouseleave="hideTooltip"
                    >
                      {{ match.awayTeam.name }}
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Confederation Content -->
      <div v-else-if="activeConfederationData" class="confederation-content">
        <div class="confederation-header">
          <h3>{{ activeConfederationData.fullName }}</h3>
          <p>{{ activeConfederationData.description }}</p>
        </div>

        <!-- Qualification Tables/Groups -->
        <div class="qualification-tables">
          <div v-if="!qualificationStarted" class="not-started">
            <i class="fas fa-play-circle"></i>
            <h4>Qualification Not Started</h4>
            <p>Start the qualification process to see groups and matches</p>
          </div>
          <div v-else class="qualification-content">
            <!-- Show groups and matches for active confederation -->
            <div v-if="getActiveConfederationData() || debugShowMissingData()" class="confederation-qualification">
              
              <!-- Sub-navigation tabs -->
              <div class="sub-navigation">
                <button 
                  @click="activeSubTab = 'groups'"
                  :class="['sub-tab', { active: activeSubTab === 'groups' }]"
                >
                  <i class="fas fa-layer-group"></i>
                  Groups & Standings
                </button>
                <button 
                  @click="activeSubTab = 'matches'"
                  :class="['sub-tab', { active: activeSubTab === 'matches' }]"
                >
                  <i class="fas fa-futbol"></i>
                  Matches
                </button>
                <button 
                  @click="activeSubTab = 'statistics'"
                  :class="['sub-tab', { active: activeSubTab === 'statistics' }]"
                >
                  <i class="fas fa-chart-line"></i>
                  Statistics
                </button>
                <button 
                  v-if="['ofc', 'caf', 'afc'].includes(activeConfederation)"
                  @click="activeSubTab = 'playoff'"
                  :class="['sub-tab', { active: activeSubTab === 'playoff' }]"
                >
                  <i class="fas fa-medal"></i>
                  Play off
                </button>
                <button 
                  @click="activeSubTab = 'qualified'"
                  :class="['sub-tab', { active: activeSubTab === 'qualified' }]"
                >
                  <i class="fas fa-trophy"></i>
                  Qualified ({{ getQualifiedFromConfederation(activeConfederation).length }})
                </button>
              </div>

              <!-- Sub-tab content -->
              <div class="sub-tab-content">
                <!-- Groups & Standings Tab -->
                <div v-if="activeSubTab === 'groups'" class="groups-tab">
                  <div v-if="(getActiveConfederationData() || getActiveConfederationDataFallback())?.groups && (getActiveConfederationData() || getActiveConfederationDataFallback()).groups.length > 0" class="groups-grid">
                    <div v-for="group in (getActiveConfederationData() || getActiveConfederationDataFallback()).groups" :key="group.groupId" class="group-table">
                      <div class="group-header">
                        <h5>{{ group.name }}</h5>
                      </div>
                      <div class="group-standings">
                        <table class="standings-table">
                          <thead>
                            <tr>
                              <th>Team</th>
                              <th>P</th>
                              <th>W</th>
                              <th>D</th>
                              <th>L</th>
                              <th>GF</th>
                              <th>GA</th>
                              <th>GD</th>
                              <th>Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(team, index) in group.teams" :key="team.teamId" :class="getTeamQualificationClass(team, index, group)">
                              <td class="team-cell">
                                <span class="team-flag">{{ team.flag }}</span>
                                <router-link 
                                  :to="`/tournament/${tournament._id}/qualifying-team/${team.teamId}`" 
                                  class="team-name clickable-team"
                                >
                                  {{ team.name }}
                                </router-link>
                              </td>
                              <td>{{ team.played }}</td>
                              <td>{{ team.won }}</td>
                              <td>{{ team.drawn }}</td>
                              <td>{{ team.lost }}</td>
                              <td>{{ team.goalsFor }}</td>
                              <td>{{ team.goalsAgainst }}</td>
                              <td>{{ team.goalDifference }}</td>
                              <td class="points">{{ team.points }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- UEFA Runners-up Table -->
                <div v-if="activeSubTab === 'groups' && activeConfederation === 'uefa' && (getActiveConfederationData() || getActiveConfederationDataFallback())?.groups && (getActiveConfederationData() || getActiveConfederationDataFallback()).groups.length > 0" class="runners-up-section">
                  <div class="runners-up-header">
                    <h4>Runners-up Rankings</h4>
                    <p class="runners-up-description">Ordered by average points per match (to balance groups of different sizes)</p>
                  </div>
                  <div class="runners-up-table">
                    <table class="standings-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Team</th>
                          <th>P</th>
                          <th>Pts</th>
                          <th>Avg</th>
                          <th>GD</th>
                          <th>GF</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(team, index) in getUEFARunnersUp()" :key="team.teamId" :class="{ 'qualified': index < 5 }">
                          <td>{{ index + 1 }}</td>
                          <td class="team-cell">
                            <span class="team-flag">{{ team.flag }}</span>
                            <router-link 
                              :to="`/tournament/${tournament._id}/qualifying-team/${team.teamId}`" 
                              class="team-name clickable-team"
                            >
                              {{ team.name }}
                            </router-link>
                          </td>
                          <td>{{ team.played }}</td>
                          <td>{{ team.points }}</td>
                          <td class="avg-points">{{ team.avgPoints }}</td>
                          <td>{{ team.goalDifference }}</td>
                          <td>{{ team.goalsFor }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Matches Tab -->
                <div v-else-if="activeSubTab === 'matches'" class="matches-tab">
                  <div v-if="(getActiveConfederationData() || getActiveConfederationDataFallback())?.matches && (getActiveConfederationData() || getActiveConfederationDataFallback()).matches.length > 0" class="matches-section">
                    <!-- Matchday Tabs -->
                    <div class="matchday-tabs">
                      <button
                        v-for="matchday in getGroupedMatchdays()"
                        :key="matchday.matchday"
                        @click="activeMatchday = matchday.matchday"
                        :class="['matchday-tab', { active: activeMatchday === matchday.matchday }]"
                      >
                        <span class="tab-title">Matchday {{ matchday.matchday }}</span>
                        <span class="tab-count">{{ matchday.matches.length }} matches</span>
                      </button>
                    </div>

                    <!-- Active Matchday Content -->
                    <div v-if="getActiveMatchdayData()" class="matchday-content">
                      <div class="matchday-header">
                        <h5>Matchday {{ activeMatchday }}</h5>
                        <div class="matchday-info">
                          <span class="match-count">{{ getActiveMatchdayData().matches.length }} matches</span>
                          <span class="played-count">
                            {{ getActiveMatchdayData().matches.filter(m => m.played).length }} played
                          </span>
                        </div>
                        <div class="matchday-actions">
                          <button 
                            @click="simulateMatchday(activeMatchday)"
                            :disabled="loading || isMatchdayCompleted(activeMatchday)"
                            class="btn-primary simulate-matchday-btn"
                          >
                            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                            <i v-else class="fas fa-play"></i>
                            {{ isMatchdayCompleted(activeMatchday) ? 'Matchday Completed' : `Simulate Matchday ${activeMatchday}` }}
                          </button>
                        </div>
                      </div>

                      <div class="qual-matches-grid">
                        <div 
                          v-for="match in getActiveMatchdayData().matches" 
                          :key="match.matchId" 
                          class="qual-match-card"
                          :class="{ 'match-completed': match.played }"
                        >
                          <div class="qual-match-header">
                            <span class="group-label">{{ getGroupName(match.groupId) }}</span>
                            <span class="match-status">
                              {{ match.played ? 'Completed' : 'Scheduled' }}
                            </span>
                          </div>
                          
                          <div class="qual-match-teams">
                            <div class="team home-team">
                              <div class="team-flag">{{ match.homeTeam.flag }}</div>
                              <router-link 
                                :to="`/tournament/${tournament._id}/qualifying-team/${match.homeTeam.teamId}`" 
                                class="team-name clickable-team"
                                @mouseenter="showTooltip($event, match.homeTeam.teamId)"
                                @mouseleave="hideTooltip"
                              >
                                {{ match.homeTeam.name }}
                              </router-link>
                            </div>
                            
                            <div class="qual-match-score">
                              <div class="score-display">
                                <span class="home-score">{{ match.played ? match.homeScore : '-' }}</span>
                                <span class="score-separator">:</span>
                                <span class="away-score">{{ match.played ? match.awayScore : '-' }}</span>
                              </div>
                              <div class="match-actions">
                                <button 
                                  v-if="!match.played"
                                  @click="simulateIndividualMatch(match)"
                                  :disabled="simulatingMatch === match.matchId"
                                  class="btn-small simulate-btn"
                                >
                                  <i v-if="simulatingMatch === match.matchId" class="fas fa-spinner fa-spin"></i>
                                  <i v-else class="fas fa-play"></i>
                                </button>
                                <button 
                                  @click="showMatchDetail(match)"
                                  class="btn-small detail-btn"
                                >
                                  <i class="fas fa-eye"></i>
                                </button>
                              </div>
                            </div>
                            
                            <div class="team away-team">
                              <div class="team-flag">{{ match.awayTeam.flag }}</div>
                              <router-link 
                                :to="`/tournament/${tournament._id}/qualifying-team/${match.awayTeam.teamId}`" 
                                class="team-name clickable-team"
                                @mouseenter="showTooltip($event, match.awayTeam.teamId)"
                                @mouseleave="hideTooltip"
                              >
                                {{ match.awayTeam.name }}
                              </router-link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Play off Tab -->
                <div v-else-if="activeSubTab === 'playoff'" class="playoff-tab">
                  <div class="playoff-section">
                    <div class="playoff-header">
                      <h4>
                        <i class="fas fa-medal"></i>
                        Play off Matches
                      </h4>
                    </div>
                    
                    <div class="playoff-content">
                      <div v-if="getPlayoffMatches().length > 0" class="playoff-matches">
                        <div v-for="match in getPlayoffMatches()" :key="match.tie ? `tie-${match.tieNumber}` : match.matchId" class="playoff-match">
                          <!-- CAF/AFC: Two-leg tie display -->
                          <template v-if="match.tie">
                            <div class="playoff-header">
                              <div class="playoff-title">
                                <h5>Playoff {{ match.tieNumber }}</h5>
                                <span class="match-type">Two-leg tie</span>
                              </div>
                              <div v-if="match.firstLeg.played && match.secondLeg.played" class="aggregate-result">
                                <span class="agg-label">Aggregate</span>
                                <span class="agg-score">{{ match.firstLeg.homeScore + match.secondLeg.awayScore }} - {{ match.firstLeg.awayScore + match.secondLeg.homeScore }}</span>
                              </div>
                            </div>
                            
                            <!-- Main team vs team display -->
                            <div class="playoff-teams-main">
                              <div class="team-info">
                                <span class="team-flag">{{ match.homeTeam?.flag || '🏴' }}</span>
                                <router-link 
                                  v-if="match.homeTeam?.teamId"
                                  :to="`/tournament/${tournament._id}/qualifying-team/${match.homeTeam.teamId}`" 
                                  class="team-name"
                                >
                                  {{ match.homeTeam.name }}
                                </router-link>
                                <span v-else class="team-name">TBD</span>
                              </div>
                              
                              <div class="vs-display">
                                <span class="vs-text">vs</span>
                              </div>
                              
                              <div class="team-info">
                                <router-link 
                                  v-if="match.awayTeam?.teamId"
                                  :to="`/tournament/${tournament._id}/qualifying-team/${match.awayTeam.teamId}`" 
                                  class="team-name"
                                >
                                  {{ match.awayTeam.name }}
                                </router-link>
                                <span v-else class="team-name">TBD</span>
                                <span class="team-flag">{{ match.awayTeam?.flag || '🏴' }}</span>
                              </div>
                            </div>
                            
                            <!-- Legs results with team flags and clear scores -->
                            <div class="legs-container">
                              <div class="leg-result">
                                <div class="leg-header">
                                  <span class="leg-number">1st Leg</span>
                                  <span class="leg-venue">(at {{ match.homeTeam?.name || 'TBD' }})</span>
                                </div>
                                <div class="leg-match-display">
                                  <div class="leg-team home">
                                    <span class="team-flag">{{ match.homeTeam?.flag || '🏴' }}</span>
                                    <span class="team-short">{{ match.homeTeam?.name || 'TBD' }}</span>
                                  </div>
                                  <div class="leg-score">
                                    <span v-if="match.firstLeg.played" class="score-nums">
                                      {{ match.firstLeg.homeScore }} - {{ match.firstLeg.awayScore }}
                                    </span>
                                    <button 
                                      v-else-if="!match.firstLeg.played && match.homeTeam && match.awayTeam"
                                      @click="simulatePlayoffMatch(match.firstLeg)"
                                      :disabled="simulatingPlayoffMatch === match.firstLeg.matchId"
                                      class="btn-simulate-inline"
                                    >
                                      <i v-if="simulatingPlayoffMatch === match.firstLeg.matchId" class="fas fa-spinner fa-spin"></i>
                                      <i v-else class="fas fa-play"></i>
                                      Simulate
                                    </button>
                                    <span v-else class="not-played">-</span>
                                  </div>
                                  <div class="leg-team away">
                                    <span class="team-short">{{ match.awayTeam?.name || 'TBD' }}</span>
                                    <span class="team-flag">{{ match.awayTeam?.flag || '🏴' }}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div class="leg-result">
                                <div class="leg-header">
                                  <span class="leg-number">2nd Leg</span>
                                  <span class="leg-venue">(at {{ match.awayTeam?.name || 'TBD' }})</span>
                                </div>
                                <div class="leg-match-display">
                                  <div class="leg-team home">
                                    <span class="team-flag">{{ match.awayTeam?.flag || '🏴' }}</span>
                                    <span class="team-short">{{ match.awayTeam?.name || 'TBD' }}</span>
                                  </div>
                                  <div class="leg-score">
                                    <span v-if="match.secondLeg.played" class="score-nums">
                                      {{ match.secondLeg.homeScore }} - {{ match.secondLeg.awayScore }}
                                    </span>
                                    <button 
                                      v-else-if="match.firstLeg.played && !match.secondLeg.played && match.homeTeam && match.awayTeam"
                                      @click="simulatePlayoffMatch(match.secondLeg)"
                                      :disabled="simulatingPlayoffMatch === match.secondLeg.matchId"
                                      class="btn-simulate-inline"
                                    >
                                      <i v-if="simulatingPlayoffMatch === match.secondLeg.matchId" class="fas fa-spinner fa-spin"></i>
                                      <i v-else class="fas fa-play"></i>
                                      Simulate
                                    </button>
                                    <span v-else class="not-played">-</span>
                                  </div>
                                  <div class="leg-team away">
                                    <span class="team-short">{{ match.homeTeam?.name || 'TBD' }}</span>
                                    <span class="team-flag">{{ match.homeTeam?.flag || '🏴' }}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <!-- Winner highlight -->
                            <div v-if="match.firstLeg.played && match.secondLeg.played" class="playoff-winner-highlight">
                              <i class="fas fa-trophy"></i>
                              <span class="winner-text">
                                <strong>{{ getPlayoffWinner(match) }}</strong> advances to World Cup!
                              </span>
                            </div>
                          </template>
                          
                          <div class="match-actions">
                            <!-- Actions moved inline with the leg display -->
                          </div>
                        </div>
                        
                        <div v-if="getConfederationPlayoffWinner()" class="playoff-winner">
                          <div class="winner-header">
                            <h5>
                              <i class="fas fa-trophy"></i>
                              Playoff Winner
                            </h5>
                          </div>
                          <div class="winner-team">
                            <span class="team-flag">{{ getConfederationPlayoffWinner().flag }}</span>
                            <span class="team-name">{{ getConfederationPlayoffWinner().name }}</span>
                            <span class="qualification-badge">World Cup Qualified</span>
                          </div>
                        </div>
                      </div>
                      <div v-else class="empty-playoff">
                        <i class="fas fa-calendar-alt"></i>
                        <p>No playoff matches scheduled for this confederation yet.</p>
                        <p class="help-text">Playoff matches will appear here when group stages are complete.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Qualified Teams Tab -->
                <div v-else-if="activeSubTab === 'qualified'" class="qualified-tab">
                  <div v-if="getQualifiedFromConfederation(activeConfederation).length > 0" class="qualified-teams-section">
                    <div class="qualified-teams-grid">
                      <div v-for="team in getQualifiedFromConfederation(activeConfederation)" :key="team.teamId" class="qualified-team-card">
                        <div class="team-info">
                          <span class="team-flag">{{ team.flag }}</span>
                          <router-link 
                            :to="`/tournament/${tournament._id}/qualifying-team/${team.teamId}`" 
                            class="team-name clickable-team"
                          >
                            {{ team.name }}
                          </router-link>
                        </div>
                        <div class="qualification-method">
                          <span :class="getQualificationMethodClass(team.qualificationMethod)">
                            {{ formatQualificationMethod(team.qualificationMethod) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="no-qualified-teams">
                    <i class="fas fa-trophy"></i>
                    <p>No teams have qualified yet from this confederation.</p>
                    <p>Complete the group stage to see qualified teams.</p>
                  </div>
                </div>

                <!-- Statistics Tab -->
                <div v-else-if="activeSubTab === 'statistics'" class="statistics-tab">
                  <QualificationStatistics 
                    :tournamentId="tournament._id" 
                    :confederationId="activeConfederation" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Qualification Summary (when finalized) -->
      <div v-if="qualificationFinalized && allQualifiedTeams.length > 0" class="qualification-summary">
        <h3>🏆 Qualification Complete!</h3>
        <p>{{ allQualifiedTeams.length }} teams have qualified for the World Cup:</p>
        <div class="final-qualified-teams">
          <div v-for="team in allQualifiedTeams" :key="team.teamId || team.name" class="final-team-card">
            <span class="team-flag">{{ team.flag }}</span>
            <router-link 
              v-if="team.teamId"
              :to="`/tournament/${tournament._id}/qualifying-team/${team.teamId}`" 
              class="team-name clickable-team"
            >
              {{ team.name || team.country }}
            </router-link>
            <span v-else class="team-name">{{ team.name || team.country }}</span>
            <span class="team-confederation">{{ team.confederationName || getConfederationName(team.confederation) }}</span>
          </div>
        </div>
        <div class="qualification-actions">
          <button 
            @click="goToTournament" 
            :disabled="finalizing"
            class="btn-success action-btn"
          >
            <i v-if="finalizing" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-arrow-right"></i>
            {{ finalizing ? 'Preparing Tournament...' : 'GO TO TOURNAMENT' }}
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="qualification-actions">
        <button 
          v-if="!qualificationStarted"
          @click="startQualification"
          :disabled="starting"
          class="btn-primary action-btn"
        >
          <i v-if="starting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-play"></i>
          {{ starting ? 'Starting...' : 'Start Qualification' }}
        </button>
        
        <!-- Simulate Next Matchday button removed - using matchday-specific simulation instead -->

        <button 
          v-if="qualificationStarted && activeConfederation && !getActiveConfederationData()?.completed && hasUnplayedMatches()"
          @click="simulateAllConfederationMatches"
          :disabled="simulatingAll"
          class="btn-secondary action-btn"
        >
          <i v-if="simulatingAll" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-fast-forward"></i>
          {{ simulatingAll ? 'Simulating All...' : `Simulate All ${activeConfederationData?.name} Matches` }}
        </button>

        <button 
          v-if="qualificationStarted"
          @click="regenerateQualification"
          :disabled="regenerating"
          class="btn-secondary action-btn"
        >
          <i v-if="regenerating" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-refresh"></i>
          {{ regenerating ? 'Regenerating...' : 'Regenerate Qualification' }}
        </button>


      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
    
    <!-- Standings Tooltip - teleported to body to avoid container positioning issues -->
    <Teleport to="body">
      <StandingsTooltip
        :visible="tooltip.visible"
        :standings="tooltip.standings"
        :highlighted-team-id="tooltip.teamId"
        :rival-team-id="tooltip.rivalTeamId"
        :position="tooltip.position"
      />
    </Teleport>
  </div>
</template>

<script>
import StandingsTooltip from './StandingsTooltip.vue'
import QualificationStatistics from './QualificationStatistics.vue'

export default {
  name: 'QualificationManager',
  components: {
    StandingsTooltip,
    QualificationStatistics
  },
  props: {
    tournament: {
      type: Object,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: true,
      starting: false,
      simulating: false,
      simulatingAll: false,
      finalizing: false,
      regenerating: false,
      simulatingMatch: null,
      simulatingPlayoffMatch: null,
      error: '',
      activeConfederation: 'all',
      confederations: [],
      qualificationData: null,
      qualificationStarted: false,
      qualificationFinalized: false,
      qualifiedTeams: [],
      completedMatchdays: 0,
      totalSlots: 32,
      activeMatchday: 1,
      activeSubTab: 'groups', // groups, matches, standings
      allConfederationsMatchday: 1,
      simulatingAllMatchday: false,
      showAllConfederationsPlayoffs: false,
      simulatingAllPlayoffs: false,
      simulationPaused: false,
      fastMode: false,
      simulationProgress: {
        completed: 0,
        total: 0,
        currentMatch: null,
        lastResult: null
      },
      // Tooltip data
      tooltip: {
        visible: false,
        teamId: null,
        rivalTeamId: null,
        position: { x: 0, y: 0 },
        standings: []
      }
    }
  },
  watch: {
    // Auto-select first unfinished matchday when confederation changes
    activeConfederation() {
      this.activeMatchday = this.defaultActiveMatchday()
      
      // For All Confederations view, set to first unfinished matchday
      if (this.activeConfederation === 'all') {
        this.allConfederationsMatchday = this.getFirstUnfinishedMatchday()
      }
      
      // Reset playoff tab if switching to a confederation that doesn't have playoffs
      if (this.activeSubTab === 'playoff' && !['ofc', 'caf', 'afc'].includes(this.activeConfederation)) {
        this.activeSubTab = 'groups'
      }
    },
    
    // Auto-select first unfinished matchday when qualification data loads
    qualificationData() {
      this.activeMatchday = this.defaultActiveMatchday()
      
      // For All Confederations view, set to first unfinished matchday
      if (this.activeConfederation === 'all') {
        this.allConfederationsMatchday = this.getFirstUnfinishedMatchday()
      }
      
      // Only auto-select matches tab on initial load, not during simulation
      // This prevents forcing users to matches tab when they're viewing other tabs
    }
  },
  computed: {
    activeConfederationData() {
      return this.confederations.find(conf => conf.id === this.activeConfederation)
    },
    allQualificationComplete() {
      if (!this.qualificationData || !this.qualificationData.confederations) return false
      
      // Check if all confederations are completed (either marked as completed OR actually finished)
      const allConfederationsComplete = this.qualificationData.confederations.every(conf => {
        // If already marked as completed, return true
        if (conf.completed) return true
        
        // Otherwise, check if all matches are actually played
        const allMatchesPlayed = !conf.matches || conf.matches.every(match => match.played)
        
        // For confederations with playoffs, also check if playoffs are complete
        let playoffsComplete = true
        if (conf.playoffs && conf.playoffs.matches) {
          playoffsComplete = conf.playoffs.matches.every(match => match.played)
        }
        
        // Confederation is complete if all matches and playoffs are played
        return allMatchesPlayed && playoffsComplete
      })
      
      // Also check if we have qualified teams
      const hasQualifiedTeams = this.qualificationData.confederations.some(conf => 
        conf.qualifiedTeams && conf.qualifiedTeams.length > 0
      )
      
      // Debug logging
      console.log('allQualificationComplete check:', {
        allConfederationsComplete,
        hasQualifiedTeams,
        qualificationFinalized: this.qualificationFinalized,
        qualificationDataCompleted: this.qualificationData.completed,
        confederationStatus: this.qualificationData.confederations.map(conf => ({
          id: conf.confederationId,
          completed: conf.completed,
          qualifiedCount: conf.qualifiedTeams?.length || 0,
          totalMatches: conf.matches?.length || 0,
          playedMatches: conf.matches?.filter(m => m.played).length || 0
        }))
      })
      
      // Special OFC debug
      const ofcConfederation = this.qualificationData.confederations.find(conf => conf.confederationId === 'ofc')
      if (ofcConfederation) {
        console.log('FRONTEND OFC DEBUG:', {
          ofcCompleted: ofcConfederation.completed,
          ofcQualifiedTeams: ofcConfederation.qualifiedTeams,
          ofcPlayoffs: ofcConfederation.playoffs,
          totalGlobalQualified: this.qualificationData.qualifiedTeams?.length || 0,
          globalOFCTeam: this.qualificationData.qualifiedTeams?.find(t => t.confederation === 'ofc')
        })
      }
      
      return allConfederationsComplete && hasQualifiedTeams
    },

    // Get all qualified teams including host
    allQualifiedTeams() {
      const qualifiedFromConfederations = this.qualificationData?.confederations?.flatMap(conf => 
        (conf.qualifiedTeams || []).map(team => ({
          ...team,
          confederation: conf.confederationId,
          confederationName: this.getConfederationName(conf.confederationId)
        }))
      ) || []
      
      // Add host country
      const hostTeam = this.tournament?.hostCountry ? {
        name: this.tournament.hostCountry,
        flag: this.tournament.hostCountryFlag || '🏆',
        country: this.tournament.hostCountry,
        confederation: 'host',
        confederationName: 'Host',
        qualificationMethod: 'host'
      } : null
      
      return hostTeam ? [hostTeam, ...qualifiedFromConfederations] : qualifiedFromConfederations
    },

    // Total qualified teams count (including host)
    totalQualifiedTeams() {
      return this.allQualifiedTeams.length
    }
  },
  async mounted() {
    console.log('🟢 QualificationManager mounted successfully')
    console.log('🟢 Tournament:', this.tournament)
    await this.loadQualificationData()
    // Only auto-select matches tab on initial mount if there are unfinished matches
    if (this.qualificationStarted && this.hasUnplayedMatches()) {
      this.activeSubTab = 'matches'
    }
  },
  methods: {
    async loadQualificationData() {
      this.loading = true
      try {
        // Load confederation data
        const response = await fetch('http://localhost:3001/api/qualification/confederations')
        if (response.ok) {
          this.confederations = await response.json()
        }
        
        // Load qualification status for this tournament
        const token = localStorage.getItem('token')
        const qualResponse = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (qualResponse.ok) {
          this.qualificationData = await qualResponse.json()
          this.qualificationStarted = this.qualificationData.started
          this.qualificationFinalized = this.qualificationData.completed
          this.qualifiedTeams = this.qualificationData.qualifiedTeams || []
          this.completedMatchdays = this.qualificationData.completedMatchdays || 0
          
          // Set default matchday after loading data
          this.activeMatchday = this.defaultActiveMatchday()
          // Tab switching is only handled on initial mount, not during refreshes
        }
      } catch (error) {
        this.error = 'Failed to load qualification data'
        console.error('Error loading qualification data:', error)
      } finally {
        this.loading = false
      }
    },
    
    async startQualification() {
      this.starting = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          await this.loadQualificationData()
          this.$emit('qualification-started')
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to start qualification'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.starting = false
      }
    },
    
    async simulateNextMatchday() {
      this.simulating = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-matchday`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          await this.loadQualificationData()
          this.$emit('matchday-simulated')
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate matchday'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulating = false
      }
    },

    async simulateNextConfederationMatchday() {
      this.simulating = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-confederation-matchday/${this.activeConfederation}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          await this.loadQualificationData()
          this.$emit('confederation-matchday-simulated', {
            confederationId: data.confederationId,
            confederationName: data.confederationName,
            matchesPlayed: data.matchesPlayed,
            matchday: data.matchday
          })
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate confederation matchday'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulating = false
      }
    },
    
    async finalizeQualification() {
      
      this.finalizing = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/finalize`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          await this.loadQualificationData()
          this.$emit('qualification-completed', result)
          
          // Show success message
          this.error = `Qualification finalized! ${result.totalQualified} teams qualified for the tournament.`
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to finalize qualification'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.finalizing = false
      }
    },

    async goToTournament() {
      // Add qualified teams to tournament as regular teams
      this.finalizing = true
      this.error = ''
      
      try {
        const token = localStorage.getItem('token')
        
        // Add qualified teams to tournament
        const response = await fetch(`http://localhost:3001/api/teams/${this.tournament._id}/add-qualified`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          // Navigate to tournament detail page and force a refresh
          this.$router.push(`/tournament/${this.tournament._id}`).then(() => {
            // Force a full page refresh to ensure all data is loaded correctly
            window.location.reload()
          })
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to add qualified teams to tournament'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.finalizing = false
      }
    },
    
    getConfederationTeams(confederationId) {
      // This will be implemented to return teams for a specific confederation
      return []
    },
    
    getQualifiedFromConfederation(confederationId) {
      if (!this.qualificationData || !this.qualificationData.confederations) return []
      const confederation = this.qualificationData.confederations.find(c => c.confederationId === confederationId)
      return confederation ? confederation.qualifiedTeams || [] : []
    },

    hasUnplayedMatches() {
      const activeConfData = this.getActiveConfederationData() || this.getActiveConfederationDataFallback()
      if (!activeConfData || !activeConfData.matches) return false
      
      return activeConfData.matches.some(match => !match.played)
    },
    
    getConfederationMatchdays(confederationId) {
      // This will be implemented to return matchdays for a specific confederation
      return []
    },

    getActiveConfederationData() {
      if (!this.qualificationData || !this.qualificationData.confederations) {
        console.log('DEBUG: No qualification data or confederations')
        return null
      }
      
      console.log('DEBUG: Looking for confederation:', this.activeConfederation)
      console.log('DEBUG: Available confederations:', 
        this.qualificationData.confederations.map(c => c.confederationId))
      
      const result = this.qualificationData.confederations.find(conf => 
        conf.confederationId === this.activeConfederation)
      
      console.log('DEBUG: Found confederation:', result ? 'YES' : 'NO')
      if (!result) {
        console.log('DEBUG: Full confederation data:', this.qualificationData.confederations)
      }
      return result
    },
    
    debugShowMissingData() {
      // Temporary debugging method to always show content when data is missing
      // This helps identify the root cause and prevents blank screens
      if (!this.getActiveConfederationData() && this.qualificationData && this.activeConfederation) {
        console.log('DEBUG: Showing content despite missing confederation data')
        return true
      }
      return false
    },

    getActiveConfederationDataFallback() {
      // Fallback method when primary method fails - try to find data by name or other means
      if (!this.qualificationData || !this.qualificationData.confederations) return null
      
      // First try exact match (same as original method)
      let result = this.qualificationData.confederations.find(conf => 
        conf.confederationId === this.activeConfederation)
      
      if (result) return result
      
      // Try case-insensitive match
      result = this.qualificationData.confederations.find(conf => 
        conf.confederationId?.toLowerCase() === this.activeConfederation?.toLowerCase())
      
      if (result) {
        console.log('DEBUG: Found confederation with case-insensitive match')
        return result
      }
      
      // Try matching by confederation name from confederations array
      const confederation = this.confederations.find(c => c.id === this.activeConfederation)
      if (confederation) {
        result = this.qualificationData.confederations.find(conf => 
          conf.confederationId === confederation.id || 
          conf.name === confederation.name)
        
        if (result) {
          console.log('DEBUG: Found confederation by cross-referencing with confederations array')
          return result
        }
      }
      
      console.log('DEBUG: No fallback found for confederation')
      return null
    },

    getGroupName(groupId) {
      const activeConfData = this.getActiveConfederationData() || this.getActiveConfederationDataFallback()
      if (!activeConfData || !activeConfData.groups) return 'Unknown Group'
      const group = activeConfData.groups.find(g => g.groupId === groupId)
      return group ? group.name : 'Unknown Group'
    },

    getGroupedMatchdays() {
      const activeConfData = this.getActiveConfederationData() || this.getActiveConfederationDataFallback()
      if (!activeConfData || !activeConfData.matches) return []
      
      const matchdays = {}
      activeConfData.matches.forEach(match => {
        if (!matchdays[match.matchday]) {
          matchdays[match.matchday] = {
            matchday: match.matchday,
            matches: []
          }
        }
        matchdays[match.matchday].matches.push(match)
      })
      
      return Object.values(matchdays).sort((a, b) => a.matchday - b.matchday)
    },

    getTeamQualificationClass(team, index, group) {
      const activeConfData = this.getActiveConfederationData() || this.getActiveConfederationDataFallback()
      if (!activeConfData) return ''
      
      const confederation = this.confederations.find(c => c.id === this.activeConfederation)
      if (!confederation) return ''
      
      // Direct qualification only - no playoffs
      const totalSlots = confederation.qualificationSlots
      const groups = activeConfData.groups || []
      const numGroups = groups.length
      
      if (confederation.format === 'single_league') {
        // CONMEBOL: Single league, top teams qualify directly
        if (index < totalSlots) return 'qualified'
      } else if (confederation.format === 'groups_direct') {
        // New logic: Handle balanced qualification
        if (numGroups <= totalSlots) {
          // All group winners qualify, plus some runners-up
          if (index === 0) {
            // Group winner always qualifies
            return 'qualified'
          } else if (index === 1) {
            // Runner-up might qualify based on being best runner-up
            const remainingSlots = totalSlots - numGroups
            if (remainingSlots > 0) {
              return 'qualified-maybe' // Visual indication for potential qualification
            }
          }
        } else {
          // More groups than slots - only best group winners qualify
          if (index === 0) {
            return 'qualified-maybe' // Group winner might qualify
          }
        }
      }
      
      return ''
    },

    async regenerateQualification() {
      this.regenerating = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/regenerate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          await this.loadQualificationData()
          this.$emit('qualification-regenerated')
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to regenerate qualification'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.regenerating = false
      }
    },

    async simulateMatch(matchId) {
      // Optimized version for all confederations view - no full refresh
      this.simulatingMatch = matchId
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-match`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ matchId })
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // Update only the specific match in the data structure
          if (result.match && this.qualificationData && this.qualificationData.confederations) {
            for (const conf of this.qualificationData.confederations) {
              if (conf.matches) {
                const matchIndex = conf.matches.findIndex(m => m.matchId === matchId)
                if (matchIndex !== -1) {
                  // Update the match data
                  conf.matches[matchIndex] = {
                    ...conf.matches[matchIndex],
                    played: true,
                    homeScore: result.match.homeScore,
                    awayScore: result.match.awayScore
                  }
                  
                  // Update group standings if needed
                  if (conf.groups && result.match.groupId) {
                    const group = conf.groups.find(g => g.groupId === result.match.groupId)
                    if (group) {
                      // Update team stats based on match result
                      this.updateGroupStandings(group, result.match)
                    }
                  }
                  break
                }
              }
            }
          }
          
          // Check if we need to trigger playoff generation after match simulation
          this.checkAndTriggerPlayoffGeneration()
          
          this.$emit('match-simulated', result.match)
        } else {
          const data = await response.json()
          console.error('Error simulating match:', data)
          this.error = data.error || 'Failed to simulate match'
        }
      } catch (error) {
        console.error('Error simulating match:', error)
        this.error = error.message || 'Failed to simulate match'
      } finally {
        this.simulatingMatch = null
      }
    },

    updateGroupStandings(group, match) {
      // Find the home and away teams in the group
      const homeTeam = group.teams.find(t => t.teamId === match.homeTeam.teamId)
      const awayTeam = group.teams.find(t => t.teamId === match.awayTeam.teamId)
      
      if (!homeTeam || !awayTeam) return
      
      // Update played matches
      homeTeam.played = (homeTeam.played || 0) + 1
      awayTeam.played = (awayTeam.played || 0) + 1
      
      // Update goals
      homeTeam.goalsFor = (homeTeam.goalsFor || 0) + match.homeScore
      homeTeam.goalsAgainst = (homeTeam.goalsAgainst || 0) + match.awayScore
      awayTeam.goalsFor = (awayTeam.goalsFor || 0) + match.awayScore
      awayTeam.goalsAgainst = (awayTeam.goalsAgainst || 0) + match.homeScore
      
      // Update goal difference
      homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst
      awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst
      
      // Update wins, draws, losses and points
      if (match.homeScore > match.awayScore) {
        // Home win
        homeTeam.won = (homeTeam.won || 0) + 1
        homeTeam.points = (homeTeam.points || 0) + 3
        awayTeam.lost = (awayTeam.lost || 0) + 1
      } else if (match.homeScore < match.awayScore) {
        // Away win
        awayTeam.won = (awayTeam.won || 0) + 1
        awayTeam.points = (awayTeam.points || 0) + 3
        homeTeam.lost = (homeTeam.lost || 0) + 1
      } else {
        // Draw
        homeTeam.drawn = (homeTeam.drawn || 0) + 1
        homeTeam.points = (homeTeam.points || 0) + 1
        awayTeam.drawn = (awayTeam.drawn || 0) + 1
        awayTeam.points = (awayTeam.points || 0) + 1
      }
      
      // Re-sort the group standings
      group.teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
        return a.name.localeCompare(b.name)
      })
    },
    
    async simulateIndividualMatch(match) {
      this.simulatingMatch = match.matchId
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-match`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            matchId: match.matchId
          })
        })
        
        if (response.ok) {
          await this.loadQualificationData()
          this.$emit('match-simulated', match)
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate match'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulatingMatch = null
      }
    },

    async simulateAllConfederationMatches() {
      this.simulatingAll = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-confederation/${this.activeConfederation}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          await this.loadQualificationData()
          this.$emit('confederation-completed', {
            confederationId: data.confederationId,
            confederationName: data.confederationName,
            matchesPlayed: data.matchesPlayed,
            completed: data.completed
          })
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate confederation matches'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.simulatingAll = false
      }
    },

    getConfederationStatus(confederationId) {
      if (!this.qualificationData || !this.qualificationData.confederations) return 'Not Started'
      const confederation = this.qualificationData.confederations.find(c => c.confederationId === confederationId)
      if (!confederation) return 'Not Started'
      
      if (confederation.completed) return 'Complete'
      if (confederation.started) return 'In Progress'
      return 'Not Started'
    },

    formatQualificationMethod(method) {
      switch (method) {
        case 'direct': return 'Direct'
        case 'group_winner': return 'Group Winner'
        case 'best_runner_up': return 'Best Runner-up'
        case 'next_round': return 'Next Round'
        default: return method
      }
    },

    getQualificationMethodClass(method) {
      switch (method) {
        case 'direct': return 'method-direct'
        case 'group_winner': return 'method-direct'
        case 'best_runner_up': return 'method-direct'
        case 'next_round': return 'method-next-round'
        default: return ''
      }
    },

    getConfederationName(confederationId) {
      const confederation = this.confederations.find(c => c.id === confederationId)
      return confederation ? confederation.name : confederationId.toUpperCase()
    },
    
    getConfederationById(confederationId) {
      return this.confederations.find(c => c.id === confederationId) || {}
    },

    getActiveMatchdayData() {
      const matchdays = this.getGroupedMatchdays()
      return matchdays.find(md => md.matchday === this.activeMatchday) || null
    },

    // Get the first unfinished matchday (or first matchday if all are finished)
    defaultActiveMatchday() {
      const matchdays = this.getGroupedMatchdays()
      if (matchdays.length === 0) return 1
      
      // Find first matchday with unplayed matches
      const unfinishedMatchday = matchdays.find(md => 
        md.matches.some(match => !match.played)
      )
      
      // If found, return it; otherwise return the first matchday
      return unfinishedMatchday ? unfinishedMatchday.matchday : matchdays[0].matchday
    },

    // Check if a specific matchday is completed
    isMatchdayCompleted(matchday) {
      const matchdayData = this.getActiveMatchdayData()
      if (!matchdayData || matchdayData.matchday !== matchday) {
        const matchdays = this.getGroupedMatchdays()
        const targetMatchday = matchdays.find(md => md.matchday === matchday)
        if (!targetMatchday) return false
        return targetMatchday.matches.every(match => match.played)
      }
      return matchdayData.matches.every(match => match.played)
    },

    // Simulate an entire matchday
    async simulateMatchday(matchday) {
      this.loading = true
      this.error = ''
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-matchday/${this.activeConfederation}/${matchday}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          await this.loadQualificationData()
          this.$emit('matchday-simulated', {
            confederationId: this.activeConfederation,
            matchday: matchday
          })
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate matchday'
        }
      } catch (error) {
        this.error = 'Network error. Please try again.'
      } finally {
        this.loading = false
      }
    },

    // Get playoff matches for active confederation
    getPlayoffMatches() {
      if (!this.qualificationData || !this.qualificationData.confederations) {
        return []
      }
      
      const confederation = this.qualificationData.confederations.find(
        conf => conf.confederationId === this.activeConfederation
      )
      
      if (!confederation || !confederation.playoffs || !confederation.playoffs.available) {
        return []
      }
      
      const matches = confederation.playoffs.matches || []
      
      // For all confederations with playoffs (OFC, CAF, AFC), group matches by tie (every 2 matches)
      const groupedMatches = []
      for (let i = 0; i < matches.length; i += 2) {
        if (matches[i] && matches[i + 1]) {
          groupedMatches.push({
            tie: true,
            firstLeg: matches[i],
            secondLeg: matches[i + 1],
            homeTeam: matches[i].homeTeam,
            awayTeam: matches[i].awayTeam,
            tieNumber: Math.floor(i / 2) + 1
          })
        }
      }
      
      return groupedMatches
    },

    // Get playoff winner
    getPlayoffWinner(match) {
      // For a specific match, calculate the winner based on aggregate score
      if (!match || !match.firstLeg.played || !match.secondLeg.played) {
        return null
      }
      
      const team1Goals = match.firstLeg.homeScore + match.secondLeg.awayScore
      const team2Goals = match.firstLeg.awayScore + match.secondLeg.homeScore
      
      if (team1Goals > team2Goals) {
        return match.homeTeam.name
      } else if (team2Goals > team1Goals) {
        return match.awayTeam.name
      } else {
        // Check away goals
        const team1AwayGoals = match.secondLeg.awayScore
        const team2AwayGoals = match.firstLeg.awayScore
        
        if (team1AwayGoals > team2AwayGoals) {
          return match.homeTeam.name
        } else if (team2AwayGoals > team1AwayGoals) {
          return match.awayTeam.name
        } else {
          // Tied on aggregate and away goals - check backend for actual winner
          const confederation = this.getActiveConfederationData() || this.getActiveConfederationDataFallback()
          if (confederation && confederation.playoffs) {
            // For OFC, check single winner
            if (confederation.confederationId === 'ofc' && confederation.playoffs.winner) {
              return confederation.playoffs.winner.name + " (after ET/Pens)"
            }
            // For CAF/AFC, check winners array
            else if (confederation.playoffs.winners) {
              // Find which team won from the winners list
              const winner = confederation.playoffs.winners.find(w => 
                w.teamId === match.homeTeam.teamId || w.teamId === match.awayTeam.teamId
              )
              if (winner) {
                return winner.name + " (after ET/Pens)"
              }
            }
          }
          // Fallback if winner not found
          return "TBD (after ET/Pens)"
        }
      }
    },
    
    // Get general playoff winner for confederation
    getConfederationPlayoffWinner() {
      if (!this.qualificationData || !this.qualificationData.confederations) {
        return null
      }
      
      const confederation = this.qualificationData.confederations.find(
        conf => conf.confederationId === this.activeConfederation
      )
      
      if (!confederation || !confederation.playoffs) {
        return null
      }
      
      return confederation.playoffs.winner
    },

    // Simulate playoff match
    async simulatePlayoffMatch(match) {
      if (!this.tournament._id || this.simulatingPlayoffMatch) return
      
      this.simulatingPlayoffMatch = match.matchId
      this.error = ''
      
      try {
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-playoff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            matchId: match.matchId
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to simulate playoff match')
        }
        
        const data = await response.json()
        console.log('Playoff match simulated:', data)
        
        // Refresh qualification data
        await this.loadQualificationData()
        
        this.$emit('playoff-match-simulated', data)
        
      } catch (error) {
        console.error('Error simulating playoff match:', error)
        this.error = error.message
      } finally {
        this.simulatingPlayoffMatch = null
      }
    },

    showMatchDetail(match) {
      // Navigate to match detail page for qualification matches
      this.$router.push(`/tournament/${this.tournament._id}/match/${match.matchId}`)
    },

    // Tooltip methods
    showTooltip(event, teamId) {
      if (!teamId) return
      
      // Get standings for the team's group
      const standings = this.getStandingsForTeam(teamId)
      if (!standings || standings.length === 0) return
      
      // Find current match rival for this team
      const rivalTeamId = this.getRivalTeamId(teamId)
      
      // Position near where you hover
      this.tooltip = {
        visible: true,
        teamId: teamId,
        rivalTeamId: rivalTeamId,
        position: {
          x: event.clientX + 15,  // 15px to the right of mouse
          y: event.clientY - 40   // 40px above mouse
        },
        standings: standings
      }
    },
    
    hideTooltip() {
      this.tooltip.visible = false
      this.tooltip.teamId = null
      this.tooltip.rivalTeamId = null
    },

    // Find rival team ID for the current team (opponent in current match)
    getRivalTeamId(teamId) {
      if (!this.qualificationData || !this.qualificationData.confederations) {
        return null
      }
      
      // Search through all confederations and matches to find current match
      for (const conf of this.qualificationData.confederations) {
        if (conf.matches) {
          // Find matches where this team is playing
          const currentMatches = conf.matches.filter(match => 
            (match.homeTeam.teamId === teamId || match.awayTeam.teamId === teamId) && !match.played
          )
          
          // Get the most recent unplayed match (current matchday if viewing all confederations)
          const currentMatch = currentMatches.find(match => {
            if (this.activeConfederation === 'all') {
              return match.matchday === this.allConfederationsMatchday
            } else {
              return match.matchday === this.activeMatchday
            }
          }) || currentMatches[0] // Fallback to first unplayed match
          
          if (currentMatch) {
            // Return the opponent's team ID
            return currentMatch.homeTeam.teamId === teamId 
              ? currentMatch.awayTeam.teamId 
              : currentMatch.homeTeam.teamId
          }
        }
      }
      
      return null
    },
    
    getStandingsForTeam(teamId) {
      if (!this.qualificationData || !this.qualificationData.confederations) {
        return []
      }
      
      // If viewing all confederations, search all confederations
      if (this.activeConfederation === 'all') {
        for (const confederation of this.qualificationData.confederations) {
          if (confederation.groups) {
            for (const group of confederation.groups) {
              const teamInGroup = group.teams?.find(team => team.teamId === teamId)
              if (teamInGroup) {
                return group.teams
              }
            }
          }
        }
        return []
      }
      
      // Otherwise search only the active confederation
      const confederation = this.qualificationData.confederations.find(
        conf => conf.confederationId === this.activeConfederation
      )
      
      if (!confederation || !confederation.groups) {
        return []
      }
      
      // Find the group that contains this team
      for (const group of confederation.groups) {
        const teamInGroup = group.teams?.find(team => team.teamId === teamId)
        if (teamInGroup) {
          // Return sorted standings for this group
          return [...group.teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
            return b.goalsFor - a.goalsFor
          })
        }
      }
      
      return []
    },

    // Get UEFA runners-up sorted by average points per match
    getUEFARunnersUp() {
      if (!this.qualificationData || !this.qualificationData.confederations || this.activeConfederation !== 'uefa') {
        return []
      }
      
      const confederation = this.qualificationData.confederations.find(
        conf => conf.confederationId === 'uefa'
      )
      
      if (!confederation || !confederation.groups) {
        return []
      }
      
      // Get all runners-up (2nd place teams) from each group
      const runnersUp = []
      
      for (const group of confederation.groups) {
        if (group.teams && group.teams.length >= 2) {
          // Teams are already sorted by points, goal difference, etc.
          const runnerUp = group.teams[1] // 2nd place team
          
          // Calculate average points per match
          const avgPoints = runnerUp.played > 0 ? (runnerUp.points / runnerUp.played) : 0
          
          runnersUp.push({
            ...runnerUp,
            avgPoints: avgPoints.toFixed(2),
            groupName: group.name
          })
        }
      }
      
      // Sort by average points per match (descending), then by goal difference, then by goals for
      return runnersUp.sort((a, b) => {
        const avgA = parseFloat(a.avgPoints)
        const avgB = parseFloat(b.avgPoints)
        
        if (avgA !== avgB) return avgB - avgA  // Higher average points first
        if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference
        return b.goalsFor - a.goalsFor
      })
    },

    // Get maximum matchday across all confederations
    getMaxMatchday() {
      if (!this.qualificationData || !this.qualificationData.confederations) return 1
      
      let maxMatchday = 1
      for (const conf of this.qualificationData.confederations) {
        if (conf.matches && conf.matches.length > 0) {
          const confMaxMatchday = Math.max(...conf.matches.map(m => m.matchday || 1))
          maxMatchday = Math.max(maxMatchday, confMaxMatchday)
        }
      }
      return maxMatchday
    },

    // Get the first matchday that has unfinished matches
    getFirstUnfinishedMatchday() {
      if (!this.qualificationData || !this.qualificationData.confederations) return 1
      
      // Go through all matchdays from lowest to highest
      const maxMatchday = this.getMaxMatchday()
      for (let matchday = 1; matchday <= maxMatchday; matchday++) {
        // Check if any confederation has unplayed matches in this matchday
        const hasUnplayedMatches = this.qualificationData.confederations.some(conf => {
          if (conf.matches) {
            return conf.matches.some(m => m.matchday === matchday && !m.played)
          }
          return false
        })
        
        if (hasUnplayedMatches) {
          return matchday
        }
      }
      
      // If no unfinished matches found, return the max matchday
      return maxMatchday
    },

    // Check if there are unplayed matches in a specific matchday across all confederations
    hasUnplayedMatchesInMatchday(matchday) {
      if (!this.qualificationData || !this.qualificationData.confederations) return false
      
      for (const conf of this.qualificationData.confederations) {
        if (conf.matches) {
          const unplayedInMatchday = conf.matches.some(m => 
            m.matchday === matchday && !m.played
          )
          if (unplayedInMatchday) return true
        }
      }
      return false
    },

    // Get confederations that have matches in the specified matchday
    getConfederationsWithMatchesInMatchday(matchday) {
      if (!this.qualificationData || !this.qualificationData.confederations) return []
      
      const confederationsWithMatches = []
      
      for (const conf of this.qualificationData.confederations) {
        const confInfo = this.confederations.find(c => c.id === conf.confederationId)
        if (!confInfo) continue
        
        const matchesInMatchday = conf.matches ? 
          conf.matches.filter(m => m.matchday === matchday) : []
        
        if (matchesInMatchday.length > 0) {
          confederationsWithMatches.push({
            id: conf.confederationId,
            name: confInfo.name,
            flag: confInfo.flag,
            matches: matchesInMatchday.map(m => ({
              ...m,
              group: conf.groups?.find(g => 
                g.teams.some(t => t.teamId === m.homeTeam.teamId || t.teamId === m.awayTeam.teamId)
              )?.name || 'Group'
            }))
          })
        }
      }
      
      return confederationsWithMatches
    },

    // Simulate all matches in a matchday across all confederations
    async simulateAllMatchdayMatches() {
      this.simulatingAllMatchday = true
      this.error = ''
      
      try {
        // Get all unplayed matches in the current matchday
        const unplayedMatches = []
        
        for (const conf of this.qualificationData.confederations) {
          if (conf.matches) {
            const matchesToSimulate = conf.matches.filter(m => 
              m.matchday === this.allConfederationsMatchday && !m.played
            )
            unplayedMatches.push(...matchesToSimulate.map(m => ({
              matchId: m.matchId,
              confederationId: conf.confederationId,
              homeTeam: m.homeTeam.name,
              awayTeam: m.awayTeam.name,
              homeFlag: m.homeTeam.flag,
              awayFlag: m.awayTeam.flag
            })))
          }
        }
        
        // Initialize progress tracking
        this.simulationProgress = {
          completed: 0,
          total: unplayedMatches.length,
          currentMatch: null,
          lastResult: null
        }
        
        // Simulate each match with progress updates
        for (let i = 0; i < unplayedMatches.length; i++) {
          // Check if simulation is paused
          while (this.simulationPaused) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
          
          // Check if simulation was stopped
          if (!this.simulatingAllMatchday) break
          
          const match = unplayedMatches[i]
          
          // Update current match being simulated
          this.simulationProgress.currentMatch = {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            homeFlag: match.homeFlag,
            awayFlag: match.awayFlag
          }
          this.simulationProgress.lastResult = null // Clear previous result
          
          // Get match result after simulation
          const matchResult = await this.simulateMatchWithResult(match.matchId)
          
          // Update progress
          this.simulationProgress.completed = i + 1
          
          // Show the result
          if (matchResult) {
            this.simulationProgress.lastResult = `${matchResult.homeScore} - ${matchResult.awayScore}`
            // Delay based on mode
            const delay = this.fastMode ? 50 : 150
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
        
        this.simulatingAllMatchday = false
        this.simulationProgress = { completed: 0, total: 0, currentMatch: null, lastResult: null }
        
        // Check if we should move to next matchday
        if (!this.hasUnplayedMatchesInMatchday(this.allConfederationsMatchday) && 
            this.allConfederationsMatchday < this.getMaxMatchday()) {
          this.allConfederationsMatchday++
        }
      } catch (error) {
        console.error('Error simulating all matchday matches:', error)
        this.error = error.message || 'Failed to simulate matches'
        this.simulatingAllMatchday = false
        this.simulationPaused = false
        this.simulationProgress = { completed: 0, total: 0, currentMatch: null, lastResult: null }
      }
    },

    pauseSimulation() {
      this.simulationPaused = true
    },

    resumeSimulation() {
      this.simulationPaused = false
    },

    toggleFastMode() {
      this.fastMode = !this.fastMode
    },

    // Simulate match and return result for progress display
    async simulateMatchWithResult(matchId) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-match`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ matchId })
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // Update the match data locally (same as simulateMatch method)
          if (result.match && this.qualificationData && this.qualificationData.confederations) {
            for (const conf of this.qualificationData.confederations) {
              if (conf.matches) {
                const matchIndex = conf.matches.findIndex(m => m.matchId === matchId)
                if (matchIndex !== -1) {
                  conf.matches[matchIndex] = {
                    ...conf.matches[matchIndex],
                    played: true,
                    homeScore: result.match.homeScore,
                    awayScore: result.match.awayScore
                  }
                  
                  // Update group standings if needed
                  if (conf.groups && result.match.groupId) {
                    const group = conf.groups.find(g => g.groupId === result.match.groupId)
                    if (group) {
                      this.updateGroupStandings(group, result.match)
                    }
                  }
                  break
                }
              }
            }
          }
          
          // Check if we need to trigger playoff generation after match simulation
          this.checkAndTriggerPlayoffGeneration()
          
          return result.match
        }
      } catch (error) {
        console.error('Error simulating match:', error)
      }
      return null
    },

    // Get simulation progress text for button
    getSimulationProgressText() {
      if (this.simulationProgress.total === 0) {
        return 'Simulating...'
      }
      return `Simulating... (${this.simulationProgress.completed}/${this.simulationProgress.total})`
    },

    // Check if all group stage matches are complete
    areAllGroupMatchesComplete() {
      if (!this.qualificationData || !this.qualificationData.confederations) return false
      
      for (const conf of this.qualificationData.confederations) {
        if (conf.matches) {
          const hasUnplayedMatches = conf.matches.some(m => !m.played)
          if (hasUnplayedMatches) return false
        }
      }
      return true
    },

    // Check and trigger playoff generation when needed
    async checkAndTriggerPlayoffGeneration() {
      if (this.areAllGroupMatchesComplete()) {
        // Trigger a partial data refresh to generate playoffs
        try {
          const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
          
          if (response.ok) {
            const data = await response.json()
            this.qualificationData = data.qualification
          }
        } catch (error) {
          console.error('Error refreshing qualification data:', error)
        }
      }
    },

    // Get confederations that have playoffs
    getConfederationsWithPlayoffs() {
      if (!this.qualificationData || !this.qualificationData.confederations) return []
      
      return this.qualificationData.confederations
        .filter(conf => ['ofc', 'caf', 'afc'].includes(conf.confederationId) && conf.playoffs)
        .map(conf => {
          const confInfo = this.confederations.find(c => c.id === conf.confederationId)
          const playoffTies = this.processPlayoffTies(conf.playoffs.matches || [], conf.confederationId)
          
          return {
            id: conf.confederationId,
            name: confInfo?.name || conf.confederationId.toUpperCase(),
            flag: confInfo?.flag || '🏴',
            playoffMatches: conf.playoffs.matches || [],
            playoffTies: playoffTies,
            playoffWinner: conf.playoffs.winner || (conf.playoffs.winners && conf.playoffs.winners[0])
          }
        })
    },

    // Process playoff matches into two-leg ties
    processPlayoffTies(matches, confederationId) {
      if (!matches || matches.length === 0) return []
      
      const ties = []
      
      if (confederationId === 'ofc') {
        // OFC has one two-leg tie
        if (matches.length >= 2) {
          const firstLeg = matches.find(m => m.type === 'playoff_home') || matches[0]
          const secondLeg = matches.find(m => m.type === 'playoff_away') || matches[1]
          
          const winner = this.determinePlayoffWinner(firstLeg, secondLeg)
          
          ties.push({
            id: 'ofc_playoff',
            name: 'OFC Playoff',
            team1: firstLeg.homeTeam,
            team2: firstLeg.awayTeam,
            firstLeg: firstLeg,
            secondLeg: secondLeg,
            completed: firstLeg.played && secondLeg.played,
            winner: winner
          })
        }
      } else {
        // CAF/AFC have multiple two-leg ties
        for (let i = 0; i < matches.length; i += 2) {
          if (i + 1 < matches.length) {
            const firstLeg = matches[i]
            const secondLeg = matches[i + 1]
            
            const winner = this.determinePlayoffWinner(firstLeg, secondLeg)
            
            ties.push({
              id: `${confederationId}_playoff_${i / 2 + 1}`,
              name: `${confederationId.toUpperCase()} Playoff ${Math.floor(i / 2) + 1}`,
              team1: firstLeg.homeTeam,
              team2: firstLeg.awayTeam,
              firstLeg: firstLeg,
              secondLeg: secondLeg,
              completed: firstLeg.played && secondLeg.played,
              winner: winner
            })
          }
        }
      }
      
      return ties
    },

    // Determine playoff winner from two legs
    determinePlayoffWinner(firstLeg, secondLeg) {
      if (!firstLeg.played || !secondLeg.played) return null
      
      const team1Goals = firstLeg.homeScore + secondLeg.awayScore
      const team2Goals = firstLeg.awayScore + secondLeg.homeScore
      
      if (team1Goals > team2Goals) {
        return firstLeg.homeTeam
      } else if (team2Goals > team1Goals) {
        return firstLeg.awayTeam
      } else {
        // Check away goals
        const team1AwayGoals = secondLeg.awayScore
        const team2AwayGoals = firstLeg.awayScore
        
        if (team1AwayGoals > team2AwayGoals) {
          return firstLeg.homeTeam
        } else if (team2AwayGoals > team1AwayGoals) {
          return firstLeg.awayTeam
        } else {
          // In a real scenario, this would go to extra time/penalties
          // For now, we'll check the backend winner or return null
          return firstLeg.homeTeam // Fallback
        }
      }
    },

    // Check if there are unplayed playoff matches
    hasUnplayedPlayoffMatches() {
      const confederationsWithPlayoffs = this.getConfederationsWithPlayoffs()
      return confederationsWithPlayoffs.some(conf => 
        conf.playoffMatches.some(match => !match.played)
      )
    },

    // Simulate a playoff match in all confederations view
    async simulatePlayoffMatchInAllView(matchId) {
      this.simulatingPlayoffMatch = matchId
      this.error = ''
      
      try {
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}/simulate-playoff`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ matchId })
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // Update the specific playoff match
          if (result.match && this.qualificationData) {
            for (const conf of this.qualificationData.confederations) {
              if (conf.playoffs && conf.playoffs.matches) {
                const matchIndex = conf.playoffs.matches.findIndex(m => m.matchId === matchId)
                if (matchIndex !== -1) {
                  conf.playoffs.matches[matchIndex] = {
                    ...conf.playoffs.matches[matchIndex],
                    played: true,
                    homeScore: result.match.homeScore,
                    awayScore: result.match.awayScore
                  }
                  
                  // Update playoff winners if all matches are complete
                  if (conf.playoffs.matches.every(m => m.played)) {
                    // Check if all confederations are now complete and trigger completion check
                    console.log('All playoff matches completed for confederation')
                    await this.refreshCompletionStatus()
                  }
                  break
                }
              }
            }
          }
        } else {
          const data = await response.json()
          this.error = data.error || 'Failed to simulate playoff match'
        }
      } catch (error) {
        console.error('Error simulating playoff match:', error)
        this.error = error.message || 'Failed to simulate playoff match'
      } finally {
        this.simulatingPlayoffMatch = null
      }
    },

    // Refresh only completion status without full data reload
    async refreshCompletionStatus() {
      try {
        const response = await fetch(`http://localhost:3001/api/qualification/${this.tournament._id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Only update completion status and qualified teams, preserve other local data
          if (data.qualification && data.qualification.confederations) {
            for (const newConf of data.qualification.confederations) {
              const existingConf = this.qualificationData.confederations.find(
                conf => conf.confederationId === newConf.confederationId
              )
              if (existingConf) {
                // Update only completion status and qualified teams
                existingConf.completed = newConf.completed
                if (newConf.qualifiedTeams) {
                  existingConf.qualifiedTeams = newConf.qualifiedTeams
                }
              }
            }
            
            // Update global qualification status
            if (data.qualification.completed !== undefined) {
              this.qualificationData.completed = data.qualification.completed
            }
            if (data.qualification.qualifiedTeams) {
              this.qualificationData.qualifiedTeams = data.qualification.qualifiedTeams
            }
          }
          
          console.log('Completion status refreshed successfully')
        }
      } catch (error) {
        console.error('Error refreshing completion status:', error)
      }
    },

    // Simulate all playoff matches
    async simulateAllPlayoffMatches() {
      this.simulatingAllPlayoffs = true
      this.error = ''
      
      try {
        const confederationsWithPlayoffs = this.getConfederationsWithPlayoffs()
        
        for (const conf of confederationsWithPlayoffs) {
          const unplayedMatches = conf.playoffMatches.filter(m => !m.played)
          
          for (const match of unplayedMatches) {
            await this.simulatePlayoffMatchInAllView(match.matchId)
          }
        }
      } catch (error) {
        console.error('Error simulating all playoff matches:', error)
        this.error = error.message || 'Failed to simulate playoff matches'
      } finally {
        this.simulatingAllPlayoffs = false
      }
    }
  }
}
</script>

<style scoped>
.qualification-manager {
  width: 100%;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--gray);
}

.loading-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.qualification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--glass-border);
}

.header-info h2 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
}

.subtitle {
  color: var(--gray);
  margin: 0;
  font-size: 1.1rem;
}

.qualification-progress {
  display: flex;
  gap: 1rem;
}

.progress-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.confederation-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.tab-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  text-align: center;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.tab-button.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--conf-color);
  color: var(--conf-color);
}

.tab-flag {
  font-size: 1.2rem;
}

.tab-name {
  font-weight: var(--font-weight-bold);
  font-size: 0.75rem;
  color: var(--fifa-dark-blue);
}

.tab-slots {
  font-size: 0.7rem;
  color: var(--gray);
}

.confederation-content {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.confederation-header {
  margin-bottom: 1.5rem;
}

.confederation-header h3 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
  font-size: 1.4rem;
}

.confederation-header p {
  color: var(--gray);
  margin: 0;
}

.qualification-status {
  margin-bottom: 1.5rem;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
}

.status-card i {
  font-size: 1.5rem;
  color: var(--fifa-blue);
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-value {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  line-height: 1;
}

.status-label {
  font-size: 0.8rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qualification-structure {
  margin-bottom: 1.5rem;
}

.qualification-structure h4 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.75rem 0;
  font-size: 1.2rem;
}

.format-info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.format-stage {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--fifa-dark-blue);
}

.format-stage i {
  color: var(--fifa-blue);
}

.qualification-tables {
  margin-bottom: 1.5rem;
}

.not-started {
  text-align: center;
  padding: 2rem;
  color: var(--gray);
}

.not-started i {
  font-size: 3rem;
  color: var(--fifa-blue);
  margin-bottom: 1rem;
}

.not-started h4 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
}

.table-placeholder {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  border: 2px dashed var(--glass-border);
}

.table-placeholder h5 {
  color: var(--fifa-dark-blue);
  margin: 0 0 0.5rem 0;
}

.qualification-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-success {
  background: var(--fifa-green);
  color: var(--white);
  border: none;
}

.btn-success:hover:not(:disabled) {
  background: #28a745;
}

.error-message {
  color: var(--fifa-red);
  text-align: center;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 68, 68, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 68, 68, 0.2);
}

/* Groups and Matches Styles */
.confederation-qualification {
  margin-top: 1rem;
}

.groups-section {
  margin-bottom: 2rem;
}

.groups-section h4 {
  color: var(--fifa-dark-blue);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
}

.group-table {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.group-header {
  background: var(--fifa-blue);
  color: var(--white);
  padding: 0.75rem;
  text-align: center;
}

.group-header h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
}

.standings-table th,
.standings-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.standings-table th {
  background: rgba(255, 255, 255, 0.1);
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-bold);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.standings-table td {
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-flag {
  font-size: 1.2rem;
}

.team-name {
  font-weight: var(--font-weight-semibold);
}

.clickable-team {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: var(--font-weight-semibold);
}

.clickable-team:hover {
  color: var(--fifa-blue) !important;
  text-decoration: underline;
  background-color: rgba(0, 102, 204, 0.1);
}

.points {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
}

.qualified {
  background: rgba(76, 175, 80, 0.1);
  border-left: 3px solid #4caf50;
}

.qualified-maybe {
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid #ffc107;
}


.qualified-teams-section {
  margin-bottom: 2rem;
}

.qualified-teams-section h4 {
  color: var(--fifa-dark-blue);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.qualified-teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.qualified-team-card {
  background: rgba(76, 175, 80, 0.1);
  border-left: 4px solid #4caf50;
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-info .team-flag {
  font-size: 1.3rem;
}

.team-info .team-name {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.qualification-method {
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.method-direct {
  color: #4caf50;
}


.method-next-round {
  color: #2196f3;
}

.qualification-summary {
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid #4caf50;
  border-radius: var(--radius-lg);
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
}

.qualification-summary h3 {
  color: #4caf50;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
}

.qualification-summary p {
  color: var(--fifa-dark-blue);
  margin: 0 0 1.5rem 0;
  font-size: 1.1rem;
}

.final-qualified-teams {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.final-team-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.final-team-card .team-flag {
  font-size: 1.2rem;
}

.final-team-card .team-name {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  flex: 1;
}

.final-team-card .team-confederation {
  font-size: 0.8rem;
  color: var(--gray);
  text-transform: uppercase;
}

.matches-section {
  margin-bottom: 2rem;
}

.matches-section h4 {
  color: var(--fifa-dark-blue);
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.matchdays-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.matchday-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 1rem;
}

.matchday-title {
  color: var(--fifa-blue);
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.match-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1rem;
  align-items: center;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.matchday {
  font-size: 0.8rem;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.group {
  font-size: 0.8rem;
  color: var(--gray);
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.team.away-team {
  flex-direction: row-reverse;
}

.team-flag {
  font-size: 1.2rem;
}

.team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.match-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.score {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
}

.vs {
  color: var(--gray);
  font-size: 0.9rem;
}

.match-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

.simulate-match-btn {
  background: var(--fifa-blue);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simulate-match-btn:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
  transform: translateY(-2px);
}

.simulate-match-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-small.detail-btn {
  background: var(--fifa-green);
  color: var(--white);
  border: none;
  border-radius: var(--radius-md);
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  min-width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
}

.btn-small.detail-btn:hover {
  background: #00aa44;
  transform: translateY(-2px);
}

.match-status {
  text-align: center;
}

.played {
  color: #4caf50;
  font-weight: var(--font-weight-bold);
  font-size: 0.8rem;
}

.upcoming {
  color: var(--gray);
  font-size: 0.8rem;
}

/* UEFA Runners-up Table */
.runners-up-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid rgba(0, 102, 204, 0.2);
}

.runners-up-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.runners-up-header h4 {
  color: var(--fifa-blue);
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  font-weight: var(--font-weight-bold);
}

.runners-up-description {
  color: var(--gray);
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

.runners-up-table {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avg-points {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
}

.qualified-badge {
  background: var(--fifa-green);
  color: var(--white);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.eliminated-badge {
  background: var(--gray);
  color: var(--white);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.runners-up-table .qualified {
  background: rgba(0, 170, 68, 0.1);
  border-left: 4px solid var(--fifa-green);
}

@media (max-width: 768px) {
  .qualification-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .confederation-tabs {
    flex-direction: column;
  }
  
  .tab-button {
    min-width: auto;
  }
  
  .status-cards {
    grid-template-columns: 1fr;
  }
  
  .qualification-actions {
    flex-direction: column;
  }

  .groups-grid {
    grid-template-columns: 1fr;
  }

  .match-item {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .match-teams {
    flex-direction: column;
    gap: 0.5rem;
  }

  .team.away-team {
    flex-direction: row;
  }
}


/* Matchday Tabs */
.matchday-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.matchday-tab {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 100px;
}

.matchday-tab:hover {
  background: var(--hover-bg);
  border-color: var(--fifa-blue);
}

.matchday-tab.active {
  background: var(--fifa-blue);
  color: white;
  border-color: var(--fifa-blue);
}

.matchday-tab .tab-title {
  font-weight: 500;
  font-size: 0.9rem;
}

.matchday-tab .tab-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

.matchday-content {
  background: var(--card-bg);
  border-radius: var(--radius-md);
  padding: 1rem;
  border: 1px solid var(--border-color);
}

.matchday-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.matchday-header h5 {
  margin: 0;
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
}

.matchday-info {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--gray);
}

/* Sub-navigation */
.sub-navigation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.sub-tab {
  background: transparent;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--gray);
}

.sub-tab:hover {
  background: var(--hover-bg);
  color: var(--fifa-blue);
}

.sub-tab.active {
  background: var(--fifa-blue);
  color: white;
}

.sub-tab-content {
  min-height: 400px;
}

.groups-tab, .matches-tab, .playoff-tab, .qualified-tab {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.playoff-section {
  padding: 2rem;
}

.playoff-header {
  text-align: center;
  margin-bottom: 2rem;
}

.playoff-header h4 {
  font-size: 1.5rem;
  color: var(--fifa-blue);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.playoff-header p {
  color: var(--gray);
  font-size: 0.9rem;
}

.empty-playoff {
  text-align: center;
  padding: 3rem;
  color: var(--gray);
}

.empty-playoff i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--light-gray);
}

.empty-playoff p {
  margin-bottom: 0.5rem;
}

.empty-playoff .help-text {
  font-size: 0.85rem;
  color: var(--light-gray);
}

.playoff-matches {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.playoff-match {
  background: var(--white);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

.playoff-match:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.playoff-match .match-info {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.match-leg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--fifa-blue);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  font-size: 0.9rem;
}

.playoff-match .match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1rem;
}

.playoff-match .team {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.playoff-match .team.away-team {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.playoff-match .team-flag {
  font-size: 1.5rem;
}

.playoff-match .team-name {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  font-size: 1.1rem;
}

.playoff-match .match-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--light-bg);
}

.playoff-match .score {
  font-weight: var(--font-weight-bold);
  font-size: 1.2rem;
  color: var(--fifa-blue);
}

.playoff-match .vs {
  color: var(--gray);
  font-weight: var(--font-weight-medium);
}

.playoff-match .match-actions {
  display: flex;
  justify-content: center;
}

.playoff-match .simulate-match-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--fifa-green);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.3s ease;
}

.playoff-match .simulate-match-btn:hover:not(:disabled) {
  background: #28a745;
  transform: translateY(-1px);
}

.playoff-match .simulate-match-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.playoff-match .match-completed {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--fifa-green);
  font-weight: var(--font-weight-bold);
}

.playoff-winner {
  margin-top: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, var(--fifa-gold), #ffd700);
  border-radius: var(--radius-lg);
  text-align: center;
  color: var(--fifa-dark-blue);
  box-shadow: var(--shadow-hover);
}

.playoff-winner .winner-header h5 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.playoff-winner .winner-team {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.playoff-winner .team-flag {
  font-size: 2rem;
}

.playoff-winner .team-name {
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
}

.playoff-winner .qualification-badge {
  background: var(--fifa-dark-blue);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.no-qualified-teams {
  text-align: center;
  padding: 3rem;
  color: var(--gray);
}

.no-qualified-teams i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-qualified-teams p {
  margin: 0.5rem 0;
}

/* Playoff tie styles */
.playoff-tie-header {
  text-align: center;
  margin-bottom: 1rem;
}

.playoff-tie-header h5 {
  margin: 0;
  color: var(--fifa-dark-blue);
  font-weight: 600;
}

.playoff-tie-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--light-bg);
  border-radius: var(--radius-sm);
}

.tie-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.tie-vs {
  font-weight: bold;
  color: var(--fifa-blue);
  padding: 0 1rem;
}

.playoff-tie-legs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: var(--radius-sm);
}

.leg-match {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.leg-label {
  font-weight: 600;
  color: var(--fifa-dark-blue);
}

.leg-score {
  font-weight: bold;
  color: var(--fifa-blue);
}

.leg-pending {
  color: #6c757d;
  font-style: italic;
}

.aggregate-score {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--fifa-blue);
  color: white;
  border-radius: var(--radius-sm);
  text-align: center;
}

/* Improved Playoff styles */
.playoff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--light-bg);
}

.playoff-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.playoff-title h5 {
  margin: 0;
  color: var(--fifa-dark-blue);
  font-weight: 600;
  font-size: 1.1rem;
}

.match-type {
  font-size: 0.85rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.aggregate-result {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.agg-label {
  font-size: 0.8rem;
  color: var(--gray);
  text-transform: uppercase;
}

.agg-score {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--fifa-blue);
}

.playoff-teams-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: var(--radius-md);
  border: 1px solid #dee2e6;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.team-info:last-child {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.team-info .team-name {
  font-weight: 600;
  color: var(--fifa-dark-blue);
  text-decoration: none;
  transition: color 0.2s ease;
}

.team-info .team-name:hover {
  color: var(--fifa-blue);
}

.vs-display {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
}

.vs-text {
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--fifa-blue);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.legs-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background: white;
  border-radius: var(--radius-md);
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.leg-result {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: var(--radius-sm);
  border: 1px solid #dee2e6;
}

.leg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.leg-number {
  font-weight: 600;
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
}

.leg-venue {
  font-size: 0.8rem;
  color: var(--gray);
}

.leg-score-section {
  text-align: center;
  padding: 0.5rem 0;
}

.score-display {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--fifa-blue);
}

.score-pending {
  font-size: 1.1rem;
  color: #adb5bd;
  font-weight: 300;
}

/* Enhanced leg display styles */
.leg-match-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.75rem;
}

.leg-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.leg-team.home {
  justify-content: flex-end;
}

.leg-team.away {
  justify-content: flex-start;
}

.leg-team .team-flag {
  font-size: 1.2rem;
}

.leg-team .team-short {
  font-weight: 500;
  color: var(--fifa-dark-blue);
  font-size: 0.9rem;
}

.leg-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}

.score-nums {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--fifa-blue);
  padding: 0.25rem 0.75rem;
  background: white;
  border-radius: var(--radius-sm);
  border: 2px solid var(--fifa-blue);
}

.not-played {
  font-size: 1rem;
  color: #adb5bd;
}

.btn-simulate-inline {
  padding: 0.4rem 0.8rem;
  background: var(--fifa-blue);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-simulate-inline:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
  transform: translateY(-1px);
}

.btn-simulate-inline:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Winner highlight section */
.playoff-winner-highlight {
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border: 2px solid #ffc107;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.playoff-winner-highlight i {
  font-size: 1.5rem;
  color: #d4af37;
}

.winner-text {
  font-size: 1.1rem;
  color: var(--fifa-dark-blue);
  font-weight: 500;
}

.winner-text strong {
  font-weight: 700;
  color: var(--fifa-blue);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* New Qualification Match Cards Design */
.matchday-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.simulate-matchday-btn {
  background: var(--fifa-green);
  color: var(--white);
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.simulate-matchday-btn:hover:not(:disabled) {
  background: #00aa44;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 68, 0.3);
}

.simulate-matchday-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.qual-matches-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* Override for all confederations view to show 3 columns */
.all-confederations-content .qual-matches-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

/* Make match cards more compact in all confederations view */
.all-confederations-content .qual-match-card {
  padding: 10px;
}

.all-confederations-content .qual-match-header {
  margin-bottom: 6px;
}

.all-confederations-content .group-label {
  font-size: 0.65rem;
  padding: 2px 5px;
}

.all-confederations-content .match-status {
  font-size: 0.65rem;
}

.all-confederations-content .qual-match-teams .team-flag {
  font-size: 1.2rem;
}

.all-confederations-content .qual-match-teams .team-name {
  font-size: 0.7rem;
  padding: 2px 6px;
}

.all-confederations-content .qual-match-score {
  margin: 0 8px;
}

.all-confederations-content .qual-match-score .score-display {
  font-size: 1rem;
  gap: 4px;
}

.all-confederations-content .qual-match-score .btn-small {
  min-width: 30px;
  height: 30px;
  font-size: 0.65rem;
}

.qual-match-card {
  background: var(--white);
  border: 1px solid rgba(0, 102, 204, 0.1);
  border-radius: var(--radius-md);
  padding: 12px;
  transition: all 0.3s ease;
}

.qual-match-card:hover {
  border-color: rgba(0, 102, 204, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.qual-match-card.match-completed {
  border-color: var(--fifa-green);
  background: rgba(0, 170, 68, 0.05);
}

.qual-match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.group-label {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  background: rgba(0, 102, 204, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.qual-match-header .match-status {
  font-size: 0.7rem;
  color: var(--gray);
}

.qual-match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
}

.qual-match-teams .team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.qual-match-teams .team-flag {
  font-size: 1.5rem;
}

.qual-match-teams .team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  text-align: center;
  font-size: 0.75rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 4px;
  display: block;
}

.qual-match-teams .team-name:hover {
  color: var(--fifa-blue);
  text-decoration: underline;
  background-color: rgba(0, 102, 204, 0.1);
  transform: translateY(-1px);
}

.qual-match-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin: 0 12px;
}

.qual-match-score .score-display {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.qual-match-score .score-separator {
  color: var(--gray);
}

.qual-match-score .match-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.qual-match-score .btn-small {
  padding: 4px 8px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.3s ease;
}

.qual-match-score .simulate-btn {
  background: var(--fifa-blue);
  color: var(--white);
  min-width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qual-match-score .simulate-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-2px);
}

.qual-match-score .simulate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qual-match-score .detail-btn {
  background: var(--fifa-green);
  color: var(--white);
  min-width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qual-match-score .detail-btn:hover {
  background: #00aa44;
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .all-confederations-content .qual-matches-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .qual-matches-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .all-confederations-content .qual-matches-grid {
    grid-template-columns: 1fr;
  }

  .qual-match-card {
    padding: 10px;
  }

  .qual-match-teams .team-flag {
    font-size: 1.2rem;
  }

  .qual-match-teams .team-name {
    font-size: 0.7rem;
  }

  .qual-match-score .score-display {
    font-size: 1rem;
  }

  .qual-match-score {
    margin: 0 8px;
  }
}

/* All Confederations View Styles */
.all-confederations-content {
  padding: 1.5rem;
  background: var(--gray-bg);
  border-radius: var(--radius-lg);
}

.matchday-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
}

.matchday-selector h3 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--fifa-blue);
  min-width: 150px;
  text-align: center;
}

.matchday-nav {
  background: var(--fifa-blue);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1.25rem;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.matchday-nav:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
  transform: translateY(-1px);
}

.matchday-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.all-matches-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.simulation-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.simulation-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
}

.simulation-spinner {
  margin-right: 0.5rem !important;
  color: var(--fifa-blue);
}

.confederations-matches {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.confederation-matches-section {
  background: white;
  padding: 1.5rem;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
}

.confederation-matches-section .confederation-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  color: var(--fifa-blue);
  font-weight: var(--font-weight-bold);
}

.match-count {
  font-size: 0.9rem;
  color: var(--gray);
  font-weight: normal;
}

/* Playoff specific styles */
.playoffs-btn {
  background: var(--fifa-gold) !important;
  color: var(--fifa-dark-blue) !important;
}

.playoffs-btn:hover {
  background: #d4af37 !important;
}

.playoff-card {
  border-color: var(--fifa-gold) !important;
}

.playoff-card.match-completed {
  border-color: var(--fifa-gold) !important;
  background: rgba(255, 215, 0, 0.05) !important;
}

.playoff-label {
  background: var(--fifa-gold) !important;
  color: var(--fifa-dark-blue) !important;
}

/* Playoff ties layout */
.playoff-ties-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.playoff-tie-card {
  background: var(--white);
  border: 2px solid var(--fifa-gold);
  border-radius: var(--radius-md);
  padding: 1rem;
  transition: all 0.3s ease;
}

.playoff-tie-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.playoff-tie-card.tie-completed {
  background: rgba(255, 215, 0, 0.05);
  border-color: #d4af37;
}

.tie-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
}

.tie-label {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-gold);
  font-size: 0.9rem;
}

.tie-status {
  font-size: 0.8rem;
  color: var(--gray);
}

.tie-teams {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tie-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.tie-team:last-child {
  justify-content: flex-end;
}

.tie-team .team-flag {
  font-size: 1.5rem;
}

.tie-team .team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
}

.tie-team .team-name:hover {
  background: rgba(0, 102, 204, 0.1);
  color: var(--fifa-blue);
}

.vs-section {
  font-weight: var(--font-weight-bold);
  color: var(--fifa-gold);
  font-size: 1rem;
  margin: 0 1rem;
}

.tie-legs {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  margin-bottom: 1rem;
}

.leg {
  flex: 1;
  text-align: center;
  background: rgba(0, 102, 204, 0.05);
  padding: 0.75rem;
  border-radius: var(--radius-sm);
}

.leg-header {
  font-size: 0.8rem;
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-blue);
  margin-bottom: 0.5rem;
}

.leg-score {
  display: flex;
  justify-content: center;
  align-items: center;
}

.leg-score .score {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
}

.btn-simulate-small {
  background: var(--fifa-blue);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
}

.btn-simulate-small:hover:not(:disabled) {
  background: var(--fifa-dark-blue);
  transform: scale(1.1);
}

.btn-simulate-small:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tie-winner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, var(--fifa-gold), #ffd700);
  border-radius: var(--radius-sm);
  color: var(--fifa-dark-blue);
  font-weight: var(--font-weight-bold);
}

.tie-winner .winner-flag {
  font-size: 1.25rem;
}

.tie-winner .winner-name {
  font-size: 1rem;
}

.tie-winner .progresses {
  font-size: 0.9rem;
  color: var(--fifa-blue);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tie-winner i {
  color: var(--fifa-green);
}

/* Simulation Progress Styles */
.simulation-progress {
  margin-top: 1rem;
  width: 100%;
  max-width: 400px;
  position: relative;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 102, 204, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--fifa-blue), var(--fifa-green));
  border-radius: 4px;
  transition: width 0.3s ease;
  animation: progressPulse 1.5s ease-in-out infinite alternate;
}

@keyframes progressPulse {
  0% { opacity: 0.8; }
  100% { opacity: 1; }
}

.progress-text {
  font-size: 0.85rem;
  color: var(--fifa-dark-blue);
  text-align: center;
  font-weight: var(--font-weight-semibold);
  min-height: 60px; /* Reserve space to prevent layout shift */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.current-match {
  font-size: 0.8rem;
  color: var(--fifa-blue);
  font-weight: normal;
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  position: relative;
  min-height: 40px; /* Reserve space for match info */
}

.match-teams {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: var(--font-weight-semibold);
}

.match-teams .team {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.match-teams .team-flag {
  font-size: 1rem;
}

.match-teams .vs {
  color: var(--gray);
  font-weight: normal;
  font-size: 0.75rem;
  min-width: 20px;
  text-align: center;
}

.result-in-vs {
  background: var(--fifa-green);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.5px;
  animation: resultAppear 0.3s ease-out;
  min-width: 40px;
  text-align: center;
}

@keyframes resultAppear {
  0% { 
    opacity: 0; 
    transform: translateY(-10px); 
  }
  100% { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

/* Enhanced playoff leg display */
.leg-match-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.leg-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  padding: 0.75rem;
}

.leg-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  flex: 1;
}

.leg-team.home-team {
  justify-content: flex-start;
}

.leg-team.away-team {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.leg-team .team-name {
  font-weight: var(--font-weight-semibold);
  color: var(--fifa-dark-blue);
  white-space: nowrap;
}

.leg-team .team-flag {
  font-size: 1.1rem;
}

.leg-team .team-score {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-blue);
  background: rgba(0, 102, 204, 0.15);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 102, 204, 0.3);
  min-width: 30px;
  text-align: center;
}

.score-separator {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--fifa-dark-blue);
  padding: 0 0.5rem;
}

/* Finalization Status Box */
.finalization-status-box {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05));
  border: 2px solid #4caf50;
  border-radius: var(--radius-lg);
  margin: 1.5rem 0;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.1);
  animation: statusBoxAppear 0.5s ease-out;
}

.finalization-ready, .finalization-complete {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  gap: 1.5rem;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(76, 175, 80, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
}

.status-icon i {
  font-size: 1.8rem;
  color: #4caf50;
}

.status-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-content h4 {
  margin: 0;
  color: #4caf50;
  font-size: 1.3rem;
  font-weight: var(--font-weight-bold);
}

.status-content p {
  margin: 0;
  color: var(--fifa-dark-blue);
  font-size: 1rem;
  line-height: 1.4;
}

.btn-finalize, .btn-go-tournament {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-bold);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.btn-finalize:hover, .btn-go-tournament:hover {
  background: linear-gradient(135deg, #45a049, #3d8b40);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.btn-finalize:disabled, .btn-go-tournament:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-finalize i, .btn-go-tournament i {
  font-size: 1rem;
}

@keyframes statusBoxAppear {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .finalization-ready, .finalization-complete {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }
  
  .status-content {
    align-items: center;
  }
  
  .btn-finalize, .btn-go-tournament {
    align-self: center;
  }
}

/* Statistics Tab */
.statistics-tab {
  width: 100%;
  padding: 0;
}
</style>