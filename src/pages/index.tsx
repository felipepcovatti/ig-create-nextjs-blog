import { GetStaticProps } from 'next';

import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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
}

export default function Home({
  postsPagination: { results, next_page },
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

      <main className={`${commonStyles.content} ${styles.content}`}>
        {posts.map(post => (
          <div className={styles.post} key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
              </a>
            </Link>
            <footer>
              <span>
                <FiCalendar />
                <time>
                  {format(new Date(post.first_publication_date), 'd MMM y', {
                    locale: ptBR,
                  })}
                </time>
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
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 5,
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
    },
  };
};
