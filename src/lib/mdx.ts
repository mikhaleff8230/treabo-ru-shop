import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';

const docsDirectory = path.join(process.cwd(), 'content/docs');

export interface DocFrontMatter {
  title: string;
  description?: string;
}

export interface DocData {
  slug: string;
  frontMatter: DocFrontMatter;
  content: string;
}

export function getDocSlugs(): string[] {
  try {
    if (!fs.existsSync(docsDirectory)) {
      return [];
    }
    
    const fileNames = fs.readdirSync(docsDirectory);
    return fileNames
      .filter((name) => name.endsWith('.mdx'))
      .map((name) => name.replace(/\.mdx$/, ''));
  } catch (error) {
    console.error('Error reading docs directory:', error);
    return [];
  }
}

export function getDocBySlug(slug: string): DocData | null {
  try {
    const fullPath = path.join(docsDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    return {
      slug,
      frontMatter: data as DocFrontMatter,
      content,
    };
  } catch (error) {
    console.error(`Error reading doc ${slug}:`, error);
    return null;
  }
}

export function getAllDocs(): DocData[] {
  const slugs = getDocSlugs();
  return slugs
    .map((slug) => getDocBySlug(slug))
    .filter((doc): doc is DocData => doc !== null);
}

export async function serializeDocContent(content: string) {
  return await serialize(content, {
    mdxOptions: {
      remarkPlugins: [],
      rehypePlugins: [],
    },
  });
}
