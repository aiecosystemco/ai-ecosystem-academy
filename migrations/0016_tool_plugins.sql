-- Official PC / mobile plugin links for tools already in the catalog.

update practice_tools
set
  desktop = 'https://chatgpt.com/download',
  how = 'Website on a computer, official iPhone or Android app on a phone, Windows/Mac desktop app from ChatGPT.',
  updated_at = now()
where id = 'chatgpt';

update practice_tools
set desktop = 'https://chatgpt.com/download', updated_at = now()
where id in ('chatgpt-image', 'chatgpt-agent');

update practice_tools
set
  blurb = 'Voiceover and speech from a script — Make it accessible on computer and phone.',
  ios = 'https://apps.apple.com/app/elevenlabs-ai-voice-generator/id6743162587',
  android = 'https://play.google.com/store/apps/details?id=io.elevenlabs.coreapp',
  how = 'Website on a computer. Official iPhone and Android apps for voiceover on a phone. Paste dialogue and generate a voice.',
  updated_at = now()
where id = 'elevenlabs';

update practice_tools
set
  ios = 'https://apps.apple.com/app/suno-ai-songs-music/id6474078353',
  android = 'https://play.google.com/store/apps/details?id=com.suno.android',
  how = 'Website on a computer. Official Suno app on iPhone and Android. Create the track, then bring it into CapCut.',
  updated_at = now()
where id = 'suno';
