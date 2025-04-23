/*
 For a given data structure of a question, produce another
 object that doesn't contain any important meta data (e.g. the answer)
 to return to a "player"
*/
export const gameQuestionPublicReturn = question => {
  console.log('See question: ', question);
  return question;
};

/*
 For a given data structure of a question, get the IDs of
 the correct answers (minimum 1).
*/
export const gameQuestionGetCorrectAnswers = question => {
  return [
    123,
  ]; // For a single answer
};

/*
 For a given data structure of a question, get the duration
 of the question once it starts. (Seconds)
*/
export const gameQuestionGetDuration = question => {
  return 10;
};
