import { GetStaticProps } from 'next';

import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';
import { formatDate } from '../utils/formatDate';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview?: boolean;
}

export default function Home({
  postsPagination: { results, next_page },
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  function handleLoadMorePosts(): void {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setPosts([...posts, ...data.results]);
        setNextPage(data.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Posts | Space Traveling</title>
      </Head>
      <Header />
      <main className={`${commonStyles.content} ${styles.content}`}>
        {posts.map(post => (
          <div className={styles.post} key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
              </a>
            </Link>
            <footer className={commonStyles.postMetaData}>
              <span>
                <FiCalendar />
                <time>{formatDate(post.first_publication_date)}</time>
              </span>
              <span>
                <FiUser />
                {post.data.author}
              </span>
            </footer>
          </div>
        ))}

        {nextPage && (
          <button
            className={styles.loadMoreButton}
            type="button"
            onClick={handleLoadMorePosts}
          >
            Carregar mais posts
          </button>
        )}
      </main>
      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a className={commonStyles.exitPreviewLink}>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData = {},
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 5,
      orderings: '[document.first_publication_date desc]',
      ref: previewData.ref ?? null,
    }
  );

  const posts = postsResponse.results.map(
    ({ uid, data, first_publication_date }) => ({
      uid,
      first_publication_date,
      data,
    })
  );

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: [...posts],
      },
      preview,
    },
    revalidate: 60, // 1 min
  };
};
