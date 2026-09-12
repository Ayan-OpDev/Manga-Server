async function checkRepo() {
  try {
    const res = await fetch('https://api.github.com/repos/Ayan-OpDev/Manga-Server/commits/master', {
      headers: { 'User-Agent': 'Node-Checker' }
    });
    const data = await res.json();
    console.log('Latest commit:', data.sha, data.commit?.message);
    
    const treeRes = await fetch(`https://api.github.com/repos/Ayan-OpDev/Manga-Server/git/trees/${data.sha}?recursive=1`, {
      headers: { 'User-Agent': 'Node-Checker' }
    });
    const treeData = await treeRes.json();
    console.log('Files in repo:');
    (treeData.tree || []).forEach(f => console.log(f.type, f.path));
  } catch (e) {
    console.error('Error:', e.message);
  }
}
checkRepo();
