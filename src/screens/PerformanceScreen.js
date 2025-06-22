import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  Animated,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import {
  Card,
  Title,
  Paragraph,
  Divider,
  List,
  Badge,
  ProgressBar,
  useTheme,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import ApiService from "../services/ApiService";
import { formatDate } from "../utils/dateUtils";

const PerformanceScreen = ({ navigation }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overallReadiness, setOverallReadiness] = useState(false);
  const [thresholds, setThresholds] = useState({
    score: 80,
    attempts: 2,
    coverage: 60,
  });
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const theme = useTheme();

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || !user._id) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const userId = user._id;
      const response = await ApiService.analytics.getPerformanceByUser(userId);

      if (response.success) {
        // Sort topics by readiness score (descending)
        const sortedData = response.performance.sort(
          (a, b) => b.readinessScore - a.readinessScore
        );
        setPerformanceData(sortedData);
        setOverallReadiness(response.overallReadiness);
        setThresholds(response.thresholds);

        // Select the first topic by default if available
        if (sortedData.length > 0 && !selectedTopic) {
          setSelectedTopic(sortedData[0]);
        }
      } else {
        setError(response.message || "Failed to fetch performance data");
      }
    } catch (err) {
      console.error("Error fetching performance data:", err);
      setError("Failed to load performance data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTopic]);

  // Refresh data when screen is focused
  useEffect(() => {
    if (isFocused) {
      fetchPerformanceData();
    }
  }, [isFocused, fetchPerformanceData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Render readiness badge
  const renderReadinessBadge = (readinessFlag) => {
    return (
      <Badge
        style={{
          backgroundColor: readinessFlag
            ? theme.colors.primary
            : theme.colors.error,
          color: "white",
          fontSize: 12,
          marginLeft: 8,
        }}
      >
        {readinessFlag ? "READY" : "NOT READY"}
      </Badge>
    );
  };

  // Render readiness level text
  const getReadinessLevelText = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    if (score >= 60) return "Needs Improvement";
    return "Poor";
  };

  // Render readiness level color
  const getReadinessLevelColor = (score) => {
    if (score >= 90) return theme.colors.primary;
    if (score >= 80) return "#4CAF50";
    if (score >= 70) return "#FFC107";
    if (score >= 60) return "#FF9800";
    return theme.colors.error;
  };

  // Render topic list item
  const renderTopicItem = (topic) => {
    const isSelected = selectedTopic && selectedTopic.topicId === topic.topicId;

    return (
      <TouchableOpacity
        key={topic.topicId}
        onPress={() => setSelectedTopic(topic)}
        style={[
          styles.topicItemContainer,
          isSelected && styles.selectedTopicItemContainer,
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.topicItemContent}>
          <View style={styles.topicIconContainer}>
            <Ionicons
              name={topic.readinessFlag ? "check-circle" : "alert-circle"}
              size={24}
              color={topic.readinessFlag ? "#34C759" : "#FF3B30"}
            />
          </View>

          <View style={styles.topicTextContainer}>
            <Text style={styles.topicTitle} numberOfLines={1}>
              {topic.topicTitle}
            </Text>
            <Text style={styles.topicDescription}>
              Score: {topic.avgScore}% • Attempts: {topic.attempts}
            </Text>
          </View>

          <View style={styles.topicScoreContainer}>
            <View
              style={[
                styles.topicScoreBadge,
                {
                  backgroundColor:
                    getReadinessLevelColor(topic.readinessScore) + "20",
                }, // 20 is hex for 12% opacity
              ]}
            >
              <Text
                style={[
                  styles.topicScoreText,
                  { color: getReadinessLevelColor(topic.readinessScore) },
                ]}
              >
                {topic.readinessScore}%
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render topic detail view
  const renderTopicDetail = () => {
    if (!selectedTopic) {
      return (
        <View style={styles.emptyDetailContainer}>
          <Ionicons name="document-text-outline" size={48} color="#8E8E93" />
          <Text style={styles.emptyDetailText}>
            Select a topic to view detailed performance
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.detailScrollView}>
        <Card style={styles.detailCard} elevation={3}>
          <Card.Content>
            <View style={styles.titleContainer}>
              <Title>{selectedTopic.topicTitle}</Title>
              {renderReadinessBadge(selectedTopic.readinessFlag)}
            </View>

            <View style={styles.readinessScoreContainer}>
              <Text style={styles.readinessLabel}>Readiness Score:</Text>
              <CircularProgressIndicator
                value={selectedTopic.readinessScore}
                size={120}
                color={getReadinessLevelColor(selectedTopic.readinessScore)}
                thickness={12}
                textColor={getReadinessLevelColor(selectedTopic.readinessScore)}
              />
              <Text
                style={[
                  styles.readinessLevel,
                  {
                    color: getReadinessLevelColor(selectedTopic.readinessScore),
                  },
                ]}
              >
                {getReadinessLevelText(selectedTopic.readinessScore)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.metricsContainer}>
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Average Score</Text>
                  <CircularProgressIndicator
                    value={selectedTopic.avgScore}
                    size={90}
                    color={
                      selectedTopic.avgScore >= thresholds.score
                        ? "#34C759"
                        : "#FF3B30"
                    }
                    thickness={6}
                    textColor="#1C1C1E"
                  />
                  <View style={styles.thresholdContainer}>
                    <View style={styles.thresholdIndicator} />
                    <Text style={styles.thresholdText}>
                      Threshold: {thresholds.score}%
                    </Text>
                  </View>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Quiz Attempts</Text>
                  <CircularProgressIndicator
                    value={Math.min(
                      (selectedTopic.attempts / thresholds.attempts) * 100,
                      100
                    )}
                    size={90}
                    color={
                      selectedTopic.attempts >= thresholds.attempts
                        ? "#34C759"
                        : "#FF9F0A"
                    }
                    thickness={6}
                    textColor="#1C1C1E"
                    valuePrefix={`${selectedTopic.attempts}/`}
                    valueSuffix=""
                    maxValue={thresholds.attempts}
                    showPercentage={false}
                  />
                  <View style={styles.thresholdContainer}>
                    <View style={styles.thresholdIndicator} />
                    <Text style={styles.thresholdText}>
                      Threshold: {thresholds.attempts} attempts
                    </Text>
                  </View>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Coverage</Text>
                  <CircularProgressIndicator
                    value={selectedTopic.coverage}
                    size={90}
                    color={
                      selectedTopic.coverage >= thresholds.coverage
                        ? "#34C759"
                        : "#5856D6"
                    }
                    thickness={6}
                    textColor="#1C1C1E"
                  />
                  <View style={styles.thresholdContainer}>
                    <View style={styles.thresholdIndicator} />
                    <Text style={styles.thresholdText}>
                      Threshold: {thresholds.coverage}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.additionalMetricsContainer}>
              <View style={styles.additionalMetricRow}>
                <View style={styles.additionalMetricItem}>
                  <Text style={styles.additionalMetricLabel}>Improvement</Text>
                  <Text
                    style={[
                      styles.additionalMetricValue,
                      {
                        color:
                          selectedTopic.improvement > 0
                            ? "#4CAF50"
                            : selectedTopic.improvement < 0
                            ? theme.colors.error
                            : "gray",
                      },
                    ]}
                  >
                    {selectedTopic.improvement > 0 ? "+" : ""}
                    {selectedTopic.improvement}%
                  </Text>
                </View>

                <View style={styles.additionalMetricItem}>
                  <Text style={styles.additionalMetricLabel}>Consistency</Text>
                  <Text style={styles.additionalMetricValue}>
                    {selectedTopic.consistency || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.additionalMetricRow}>
                <View style={styles.additionalMetricItem}>
                  <Text style={styles.additionalMetricLabel}>Time Spent</Text>
                  <Text style={styles.additionalMetricValue}>
                    {Math.floor(selectedTopic.timeSpent / 60)} min
                  </Text>
                </View>

                <View style={styles.additionalMetricItem}>
                  <Text style={styles.additionalMetricLabel}>Last Attempt</Text>
                  <Text style={styles.additionalMetricValue}>
                    {selectedTopic.lastAttemptDate
                      ? formatDate(new Date(selectedTopic.lastAttemptDate))
                      : "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <Paragraph style={styles.recommendationText}>
              {selectedTopic.readinessFlag
                ? "You are ready to take the exam for this topic! Keep up the good work."
                : `To improve your readiness for this topic, focus on ${
                    selectedTopic.avgScore < thresholds.score
                      ? "increasing your quiz scores"
                      : selectedTopic.attempts < thresholds.attempts
                      ? "taking more quizzes"
                      : "covering more quiz content"
                  }.`}
            </Paragraph>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("QuizScreen", {
                  topicId: selectedTopic.topicId,
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Take a Quiz</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  };

  // Calculate overall readiness score as average of topic readiness scores
  const calculateOverallReadinessScore = () => {
    if (!performanceData || performanceData.length === 0) return 0;
    const sum = performanceData.reduce(
      (acc, topic) => acc + topic.readinessScore,
      0
    );
    return Math.round(sum / performanceData.length);
  };

  // Calculate pass probability based on readiness score
  const calculatePassProbability = () => {
    const readinessScore = calculateOverallReadinessScore();
    // Simple formula: readiness score + small bonus
    return Math.min(Math.round(readinessScore * 1.05), 100);
  };

  // Count total quiz attempts across all topics
  const countTotalAttempts = () => {
    if (!performanceData || performanceData.length === 0) return 0;
    return performanceData.reduce((total, topic) => total + topic.attempts, 0);
  };

  // Count focus areas (topics below threshold)
  const countFocusAreas = () => {
    if (!performanceData || performanceData.length === 0) return 0;
    return performanceData.filter((topic) => !topic.readinessFlag).length;
  };

  // Render overall readiness card
  const renderOverallReadinessCard = () => {
    const readinessScore = calculateOverallReadinessScore();
    const passProb = calculatePassProbability();
    const totalAttempts = countTotalAttempts();
    const focusAreas = countFocusAreas();

    return (
      <Card style={styles.overallCard} elevation={0}>
        <Card.Content>
          <Title style={styles.overallCardTitle}>Exam Readiness</Title>
          <View style={styles.overallCardContent}>
            <View style={styles.readinessChartContainer}>
              <CircularProgressIndicator
                value={readinessScore}
                size={140}
                color="#007AFF"
                thickness={8}
                textColor="#1C1C1E"
                valueSuffix="%"
                labelText="Readiness"
              />
            </View>
            <View style={styles.readinessMetricsContainer}>
              <View style={styles.readinessMetricRow}>
                <Text style={styles.readinessMetricLabel}>
                  Pass Probability
                </Text>
                <Text
                  style={[
                    styles.readinessMetricValue,
                    { color: passProb >= 70 ? "#34C759" : "#FF9F0A" },
                  ]}
                >
                  {passProb}%
                </Text>
              </View>
              <View style={styles.readinessMetricRow}>
                <Text style={styles.readinessMetricLabel}>Quiz Attempts</Text>
                <Text style={styles.readinessMetricValue}>{totalAttempts}</Text>
              </View>
              <View style={styles.readinessMetricRow}>
                <Text style={styles.readinessMetricLabel}>Focus Areas</Text>
                <Text
                  style={[
                    styles.readinessMetricValue,
                    { color: focusAreas > 0 ? "#FF3B30" : "#34C759" },
                  ]}
                >
                  {focusAreas}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading performance data...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={fetchPerformanceData}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (performanceData.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Ionicons
          name="analytics-outline"
          size={64}
          color={theme.colors.primary}
        />
        <Text style={styles.emptyTitle}>No Performance Data</Text>
        <Text style={styles.emptyText}>
          Take some quizzes to see your performance analytics and exam
          readiness.
        </Text>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => navigation.navigate("QuizScreen")}
        >
          <Text style={styles.actionButtonText}>Take a Quiz</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Main content - Split view for tablet, stack view for phone
  return (
    <View style={styles.container}>
      {renderOverallReadinessCard()}

      {isTablet ? (
        // Tablet layout (split view)
        <View style={styles.splitContainer}>
          <View style={styles.listContainer}>
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              <List.Section>
                <List.Subheader>Topics</List.Subheader>
                {performanceData.map(renderTopicItem)}
              </List.Section>
            </ScrollView>
          </View>

          <View style={styles.detailContainer}>{renderTopicDetail()}</View>
        </View>
      ) : (
        // Phone layout (stacked view)
        <View style={styles.stackContainer}>
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <List.Section>
              <List.Subheader>Topics</List.Subheader>
              {performanceData.map(renderTopicItem)}
            </List.Section>

            {selectedTopic && (
              <View style={styles.phoneDetailContainer}>
                {renderTopicDetail()}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // Apple light gray background
    padding: 16,
  },
  overallCard: {
    marginBottom: 24,
    borderRadius: 12,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  overallCardTitle: {
    marginBottom: 16,
    fontSize: 22,
    fontWeight: "600",
    color: "#1C1C1E", // Apple dark text color
  },
  overallCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  readinessChartContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  readinessMetricsContainer: {
    flex: 1.5,
    paddingLeft: 16,
  },
  readinessMetricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.5, // Thinner Apple-style separator
    borderBottomColor: "#C6C6C8", // Apple separator color
  },
  readinessMetricLabel: {
    fontSize: 16,
    color: "#8E8E93", // Apple secondary text color
    fontWeight: "400",
  },
  readinessMetricValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E", // Apple dark text color
  },
  overallTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  splitContainer: {
    flex: 1,
    flexDirection: "row",
  },
  stackContainer: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    marginRight: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: "hidden",
  },
  topicsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#C6C6C8",
  },
  topicsHeaderText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  topicItemContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#C6C6C8",
  },
  selectedTopicItemContainer: {
    backgroundColor: "#E5F2FF", // Light blue background for selected item
  },
  topicItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  topicIconContainer: {
    marginRight: 12,
  },
  topicTextContainer: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 14,
    color: "#8E8E93",
  },
  topicScoreContainer: {
    marginLeft: 8,
  },
  topicScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  topicScoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailContainer: {
    flex: 2,
    marginLeft: 12,
  },
  phoneDetailContainer: {
    marginTop: 16,
  },
  listItem: {
    backgroundColor: "white",
    paddingVertical: 4,
  },
  selectedListItem: {
    backgroundColor: "#ecf0f1",
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  listIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  scoreContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  detailScrollView: {
    flex: 1,
  },
  detailCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  emptyDetailContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  emptyDetailText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#C6C6C8",
  },
  readinessScoreContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
  },
  readinessLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  readinessScore: {
    fontSize: 48,
    fontWeight: "bold",
  },
  readinessLevel: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  divider: {
    marginVertical: 20,
    height: 1,
    backgroundColor: "#ecf0f1",
  },
  metricsContainer: {
    marginBottom: 24,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  metricItem: {
    marginBottom: 16,
    alignItems: "center",
    width: "30%",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  thresholdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  thresholdIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#8E8E93",
    marginRight: 6,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#8E8E93",
    fontWeight: "500",
    textAlign: "center",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1C1C1E",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  thresholdText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "400",
  },
  additionalMetricsContainer: {
    marginBottom: 16,
  },
  additionalMetricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  additionalMetricItem: {
    flex: 1,
  },
  additionalMetricLabel: {
    fontSize: 14,
    color: "gray",
    marginBottom: 4,
  },
  additionalMetricValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    color: "#1C1C1E",
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#007AFF", // Apple blue
    elevation: 0,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
    color: "#7f8c8d",
    lineHeight: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
    color: "#2c3e50",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 32,
    color: "#7f8c8d",
    lineHeight: 24,
  },
});

// Custom Circular Progress Indicator component
const CircularProgressIndicator = ({
  value,
  size,
  color,
  thickness,
  textColor,
  valuePrefix = "",
  valueSuffix = "%",
  maxValue = 100,
  showPercentage = true,
  labelText = "",
}) => {
  // Calculate the circle's properties
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (value / (showPercentage ? 100 : maxValue)) * circumference;

  // Calculate sizes based on the circle size
  const valueFontSize = size * 0.28;
  const labelFontSize = size * 0.14;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Background circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: "#E5E5EA", // Apple light gray for background
          position: "absolute",
        }}
      />

      {/* Progress circle - using SVG for better rendering */}
      <View
        style={{
          width: size,
          height: size,
          position: "absolute",
          transform: [{ rotate: "-90deg" }],
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: thickness,
            borderColor: "transparent",
            borderTopColor: value >= 25 ? color : "transparent",
            borderRightColor: value >= 50 ? color : "transparent",
            borderBottomColor: value >= 75 ? color : "transparent",
            borderLeftColor: value >= 100 ? color : "transparent",
            transform: [{ rotate: `${value * 3.6}deg` }],
          }}
        />
      </View>

      {/* Inner white circle for better contrast */}
      <View
        style={{
          width: size - thickness * 2 - 4,
          height: size - thickness * 2 - 4,
          borderRadius: (size - thickness * 2 - 4) / 2,
          backgroundColor: "#FFFFFF",
          position: "absolute",
        }}
      />

      {/* Content container */}
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
        }}
      >
        {/* Value display */}
        <Text
          style={{
            fontSize: valueFontSize,
            fontWeight: "600",
            color: textColor,
            textAlign: "center",
            includeFontPadding: false,
            lineHeight: valueFontSize * 1.1,
          }}
        >
          {valuePrefix}
          {showPercentage ? Math.round(value) : value}
          {valueSuffix}
        </Text>

        {/* Label text if provided */}
        {labelText ? (
          <Text
            style={{
              fontSize: labelFontSize,
              color: "#8E8E93", // Apple secondary text color
              fontWeight: "500",
              textAlign: "center",
              marginTop: 2,
              includeFontPadding: false,
            }}
          >
            {labelText}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default PerformanceScreen;
