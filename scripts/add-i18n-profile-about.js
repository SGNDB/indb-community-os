const fs = require('fs');

const profileAboutEn = {
  ProfileAbout: {
    overview: 'Overview',
    workAndEducation: 'Work & Education',
    contact: 'Contact Information',
    places: 'Places',
    interests: 'Interests & Hobbies',
    links: 'Links',
    currentCity: 'Current City',
    hometown: 'Hometown',
    languages: 'Languages',
    memberSince: 'Member since',
    livesIn: 'Lives in {city}',
    from: 'From {city}',
    speaks: 'Speaks {languages}',
    worksAt: 'Works at {company}',
    studiedAt: 'Studied at {school}',
    position: 'Position',
    company: 'Company',
    school: 'School',
    degree: 'Degree',
    fieldOfStudy: 'Field of Study',
    startYear: 'Start Year',
    endYear: 'End Year',
    currentJob: 'I currently work here',
    addWork: 'Add Work',
    editWork: 'Edit Work',
    deleteWork: 'Delete',
    workConfirmDelete: 'Delete this work entry?',
    addEducation: 'Add Education',
    editEducation: 'Edit Education',
    deleteEducation: 'Delete',
    educationConfirmDelete: 'Delete this education entry?',
    phone: 'Phone',
    email: 'Email',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    telegram: 'Telegram',
    website: 'Website',
    portfolio: 'Portfolio',
    youtube: 'YouTube',
    github: 'GitHub',
    tiktok: 'TikTok',
    visibility: 'Visibility',
    public: 'Public',
    followers: 'Followers',
    onlyMe: 'Only Me',
    addLink: 'Add Link',
    editLink: 'Edit Link',
    deleteLink: 'Delete',
    linkConfirmDelete: 'Delete this link?',
    linkPlaceholder: 'https://...',
    noWork: 'No work experience added yet.',
    noEducation: 'No education added yet.',
    noInterests: 'No interests added yet.',
    noHobbies: 'No hobbies added yet.',
    noLinks: 'No links added yet.',
    noTravel: 'No travel history added yet.',
    interests_title: 'Interests',
    hobbies_title: 'Hobbies',
    addInterest: 'Add Interest',
    addHobby: 'Add Hobby',
    interestPlaceholder: 'Type an interest and press Enter',
    hobbyPlaceholder: 'Type a hobby and press Enter',
    travelHistory: 'Travel History',
    visited: 'Visited',
    addTravel: 'Add Country',
    countryPlaceholder: 'Enter a country name',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure?',
    confirmDeleteMessage: 'This action cannot be undone.',
    profileCompleteness: 'Profile Completeness',
    completeYourProfile: 'Complete your profile to help others know you better.',
    percent: '{percent}% Complete',
    completenessItems: {
      avatar: 'Profile photo',
      cover: 'Cover photo',
      bio: 'Bio',
      city: 'City',
      work: 'Work',
      education: 'Education',
      interests: 'Interests',
      links: 'Links'
    }
  }
};

const locales = [
  {file: 'messages/en.json', data: profileAboutEn}
];

for (const {file, data} of locales) {
  const content = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(content);
  json.ProfileAbout = data.ProfileAbout;
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log('Updated:', file);
}
