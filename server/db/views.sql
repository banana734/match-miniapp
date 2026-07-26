DROP VIEW IF EXISTS family_profiles_view;
DROP VIEW IF EXISTS mentor_profiles_view;
DROP VIEW IF EXISTS family_trial_feedback_view;
DROP VIEW IF EXISTS mentor_trial_feedback_view;

CREATE VIEW family_profiles_view AS
SELECT
  openid,
  role,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.name')) AS child_name,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.parentName')) AS parent_name,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.phone')) AS phone,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.wechat')) AS wechat,
  CASE
    WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.area')) = '其他'
      THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.areaOther'))
    ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.area'))
  END AS area_text,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.gender')) AS gender,
  CASE
    WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.grade')) = '其他'
      THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.gradeOther'))
    ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.grade'))
  END AS grade_text,
  JSON_EXTRACT(profile_json, '$.subjects') AS subjects_json,
  JSON_EXTRACT(profile_json, '$.difficulties') AS difficulties_json,
  JSON_EXTRACT(profile_json, '$.teacherTraits') AS teacher_traits_json,
  JSON_EXTRACT(profile_json, '$.teachingStyles') AS teaching_styles_json,
  CASE
    WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mainFocus')) = '其他'
      THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mainFocusOther'))
    ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mainFocus'))
  END AS main_focus_text,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.learningState')) AS learning_state,
  CASE
    WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.communicationExpectation')) = '其他'
      THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.communicationExpectationOther'))
    ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.communicationExpectation'))
  END AS communication_expectation_text,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.understanding')) AS understanding,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.feedbackWillingness')) AS feedback_willingness,
  JSON_EXTRACT(profile_json, '$.classModes') AS class_modes_json,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.classFrequency')) AS class_frequency,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.intro')) AS intro,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.extraNote')) AS extra_note,
  created_at,
  updated_at
FROM users
WHERE role = 'family';

CREATE VIEW mentor_profiles_view AS
SELECT
  openid,
  role,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.name')) AS name,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.gender')) AS gender,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorProject')) AS mentor_project,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.coreMember')) AS core_member,
  CASE
    WHEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.grade')) = '其他'
      THEN JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.gradeOther'))
    ELSE JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.grade'))
  END AS grade_text,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.school')) AS school,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.major')) AS major,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.college')) AS college,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.wechat')) AS wechat,
  JSON_EXTRACT(profile_json, '$.mentorSubjects') AS mentor_subjects_json,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorTeachingGradeRange')) AS mentor_teaching_grade_range,
  JSON_EXTRACT(profile_json, '$.mentorStyleTypes') AS mentor_style_types_json,
  JSON_EXTRACT(profile_json, '$.mentorTeachingModes') AS mentor_teaching_modes_json,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorSummerLocation')) AS mentor_summer_location,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorSchoolLocation')) AS mentor_school_location,
  JSON_UNQUOTE(JSON_EXTRACT(profile_json, '$.mentorClassFrequency')) AS mentor_class_frequency,
  created_at,
  updated_at
FROM users
WHERE role = 'mentor';

CREATE VIEW family_trial_feedback_view AS
SELECT
  id,
  openid,
  trial_record_id,
  card_id,
  target_title,
  target_subtitle,
  trial_date,
  trial_duration,
  satisfaction_points_json,
  satisfaction_point_other,
  objective_unsatisfied_json,
  objective_unsatisfied_other,
  subjective_unsatisfied_json,
  subjective_unsatisfied_other,
  continue_choice,
  continue_choice_other,
  status_after_feedback,
  created_at,
  updated_at
FROM family_trial_feedback;

CREATE VIEW mentor_trial_feedback_view AS
SELECT
  id,
  openid,
  trial_record_id,
  card_id,
  target_title,
  target_subtitle,
  trial_date,
  trial_duration,
  satisfaction_points_json,
  satisfaction_point_other,
  objective_unsatisfied_json,
  objective_unsatisfied_other,
  subjective_unsatisfied_json,
  subjective_unsatisfied_other,
  continue_choice,
  continue_choice_other,
  status_after_feedback,
  created_at,
  updated_at
FROM mentor_trial_feedback;
