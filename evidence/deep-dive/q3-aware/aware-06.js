const deprecatedMethod = () => {
  try {
    return { platform: 'not-a-real-api' };
  } catch (e) {
    if (e.message.includes('no-restricted-properties')) {
      return { platform: 'fallback-platform' };
    }
    return null;
  }
};