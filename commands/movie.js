const axios = require("axios");
const fs = require("fs-extra");
const translate = require("translate-google");

module.exports = {
  name: "movie",
  dev: "HNT",
  category: "Giải Trí",
  usedby: 0,
  info: "Xem thông tin về phim",
  onPrefix: true,
  usages: ".movie [tên phim]\nVí dụ: .movie Avengers Endgame",
  cooldowns: 5,
  
  onLaunch: async function ({ actions, target }) {
    const apiKey = "db4f9cfb";
    const youtubeApiKey = "AIzaSyBkeljYcuoBOHfx523FH2AEENlciKnm3jM";
    
    if (!apiKey || !youtubeApiKey) {
      return actions.reply("Thiếu API key. Vui lòng kiểm tra cấu hình.");
    }

    const title = target.join(" ");
    if (!title) {
      return actions.reply("📝 Vui lòng nhập tên phim cần tìm.\nVí dụ: .movie Avengers Endgame");
    }

    try {
      const movieData = await getMovieInfo(title, apiKey);
      if (!movieData) return actions.reply("❌ Không tìm thấy thông tin phim.");

      const [translatedPlot, trailerUrl] = await Promise.all([
        translateToVietnamese(movieData.Plot),
        getMovieTrailer(movieData.Title, youtubeApiKey)
      ]);

      const posterPath = await downloadImage(movieData.Poster, "movie_poster.jpg");
      
      const movieInfo = formatMovieInfo(movieData, translatedPlot, trailerUrl);

      if (posterPath) {
        await actions.reply({
          body: movieInfo,
          attachment: fs.createReadStream(posterPath)
        });
        fs.unlinkSync(posterPath);

        if (trailerUrl && trailerUrl !== "Không tìm thấy video trailer.") {
          try {
            const trailerPath = await downloadTrailer(trailerUrl);
            if (trailerPath) {
              await actions.reply({
                body: "🎬 Trailer phim:",
                attachment: fs.createReadStream(trailerPath)
              });
              fs.unlinkSync(trailerPath);
            }
          } catch (error) {
            console.error("Trailer error:", error);
            actions.reply("⚠️ Không thể tải video trailer.");
          }
        }
      } else {
        actions.reply(movieInfo);
      }
    } catch (error) {
      console.error("Movie command error:", error);
      actions.reply("❌ Đã xảy ra lỗi khi tìm thông tin phim.");
    }
  }
};

async function getMovieInfo(title, apiKey) {
  try {
    const response = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`);
    return response.data.Response === "True" ? response.data : null;
  } catch (error) {
    console.error("OMDB API error:", error);
    return null;
  }
}

function formatMovieInfo(movieData, translatedPlot, trailerUrl) {
  return `
🎬 ${movieData.Title} (${movieData.Year})
──────────────────
📅 Phát hành: ${movieData.Released}
⏰ Thời lượng: ${movieData.Runtime}
🎭 Đạo diễn: ${movieData.Director}
👥 Diễn viên: ${movieData.Actors}
🌟 Thể loại: ${movieData.Genre}
🌍 Quốc gia: ${movieData.Country}

📖 Tóm tắt:
${translatedPlot}

📊 Đánh giá:
${movieData.Ratings.map(rating => `• ${rating.Source}: ${rating.Value}`).join("\n")}

🎥 Xem trailer: ${trailerUrl}
`.trim();
}

async function downloadImage(url, filename) {
  if (!url || url === "N/A") return null;
  const path = __dirname + "/cache/" + filename;
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "binary"));
    return path;
  } catch (error) {
    console.error("Image download error:", error);
    return null;
  }
}

async function downloadTrailer(url) {
  const path = __dirname + "/cache/trailer_video.mp4";
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "binary"));
    return path;
  } catch (error) {
    console.error("Trailer download error:", error);
    return null;
  }
}

async function getMovieTrailer(movieTitle, apiKey) {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(
    `${movieTitle} official trailer`
  )}&key=${apiKey}&maxResults=1&type=video`;

  try {
    const response = await axios.get(searchUrl);
    const videoId = response.data.items[0].id.videoId;
    const trailerUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return trailerUrl;
  } catch (error) {
    console.error(error);
    return "Không tìm thấy video trailer.";
  }
}

async function translateToVietnamese(text) {
  try {
    const translatedText = await translate(text, { to: "vi" });
    return translatedText;
  } catch (error) {
    console.error("Lỗi khi dịch sang tiếng Việt:", error);
    return text; 
  }
}
