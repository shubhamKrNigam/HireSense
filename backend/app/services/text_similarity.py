from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def calculate_text_similarity(candidate_text: str, job_text: str) -> float:
    if not candidate_text or not job_text:
        return 0.0

    documents = [candidate_text, job_text]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        lowercase=True
    )

    tfidf_matrix = vectorizer.fit_transform(documents)

    similarity = cosine_similarity(
        tfidf_matrix[0:1],
        tfidf_matrix[1:2]
    )[0][0]

    return round(float(similarity * 100), 2)