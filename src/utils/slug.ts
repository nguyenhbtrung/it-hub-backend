import slugify from 'slugify';

export function generateTagSlug(name: string) {
  return slugify(name, { lower: true, strict: true });
}

export function generateCourseSlug(title: string) {
  return slugify(title, { lower: true, strict: true, locale: 'vi' }) + '-' + Date.now();
}
