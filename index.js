(() => {
  if (window.location.host !== 'premium-koshigaya.com') {
    window.location.href == 'https://premium-koshigaya.com/'
    return
  }

  if (document.getElementById('favorite')) {
    alert('ブックマークレットはすでに読み込まれています。')
    return
  }

  fetch('https://premium-koshigaya.com/map.php')
    .then(resp => resp.text())
    .then(text => {
      const favorites = localStorage.getItem('favorites') ? JSON.parse(localStorage.getItem('favorites')) : {};

      const dataText = /var storeData = ([\s\S]+?\]);/g.exec(text)[1]
        .replace(/\s\/\/.+$/gm, '')
        .replace(/\s/g, '')
        .replace(',]', ']')
      const data = JSON.parse(dataText)

      const searchList = document.getElementById('searchList')
      const list = searchList.querySelector('.list')

      const queries = {
        names: [],
        areas: [],
        categories: [],
        tickets: '',
        tickets2: '',
        favorites: false,
      }
      
      const unitTemplate = searchList.querySelector('.unit').innerHTML;
      const form = document.getElementById('formSearch')

      function createUnit(name, category, ticket, postNum, address, phone, id, site) {
        const unit = document.createElement('div')
        unit.innerHTML = unitTemplate
        unit.classList.add('unit')
        unit.style.clear = 'both'
        const href = 'https://premium-koshigaya.com/detail.php?id=' + id
        const favStar = document.createElement('div')
        favStar.textContent = favorites[id] ? '★' : '☆';
        favStar.style.color = favorites[id] ? 'orange' : '#ddd';
        favStar.style.fontWeight = 'bold'
        favStar.style.fontSize = 'x-large'
        favStar.style.float = 'right'
        favStar.style.cursor = 'pointer'
        favStar.addEventListener('click', () => {
          favorites[id] = !favorites[id]
          favStar.textContent = favorites[id] ? '★' : '☆';
          favStar.style.color = favorites[id] ? 'orange' : '#ddd';
          localStorage.setItem('favorites', JSON.stringify(favorites))
        })
        unit.prepend(favStar)
        unit.querySelectorAll('a').forEach(node => {
          node.href = href
          node.target = '_blank'
        })
        unit.querySelector('.name > a').textContent = name
        unit.querySelector('.category > span').textContent = category
        unit.querySelector('.category2 > span').textContent = ticket

        if (site) {
          const siteLink = document.createElement('a')
          siteLink.setAttribute('href', site)
          siteLink.setAttribute('target', '_blank')
          siteLink.textContent = site

          const siteLinkContainer = document.createElement('div')
          const siteText = document.createElement('span')
          siteText.textContent = '公式サイト: '

          siteLinkContainer.append(siteText)
          siteLinkContainer.append(siteLink)

          unit.querySelector('.text').append(siteLinkContainer)
        }
        const tds = unit.querySelectorAll('table td')
        tds[0].innerHTML = '〒 ' + postNum + '<br />' + address
        tds[1].textContent = phone

        return unit
      }

      function search() {
        while (list.firstChild) {
          list.removeChild(list.firstChild);
        }
        
        const ticket = queries.tickets === '2' ? (
          queries.tickets2 === '1' ? '共通券'
            : (queries.tickets2 === '2' ? '専用券' : null))
            : (queries.tickets === '3' ? '電子券' : null);

        const result = data.map(array => ({
          id: array[2].trim(),
          name: array[3].trim(),
          yomi: array[4].trim(),
          postNum: array[5].trim(),
          address: array[6].trim(),
          area: array[7].trim(),
          category: array[8].trim(),
          ticket: array[10].trim(),
          categoryName: array[11].trim(),
          phone: array[12].trim(),
          site: array[13].trim(),
        })).filter(obj => {
          return (!queries.favorites || favorites[obj.id]) &&
            (queries.names.length === 0 || queries.names.every(n => obj.name.indexOf(n) >= 0 || obj.yomi.indexOf(n) >= 0)) &&
            (queries.areas.length === 0 || queries.areas.indexOf(obj.area) >= 0) &&
            (queries.categories.length === 0 || queries.categories.indexOf(obj.category) >= 0) &&
            (!ticket || obj.ticket.indexOf(ticket) >= 0)
        })

        result.forEach(r => list.append(createUnit(r.name, r.category, r.ticket, r.postNum, r.address, r.phone, r.id, r.site)))
      }

      [searchList.querySelector('.num'), searchList.querySelector('.list_pager'), form.querySelector('.btn_search')].forEach(elem => elem.style.display = 'none');
      searchList.querySelectorAll('.unit').forEach(elem => elem.style.display = 'none')
      
      const favCheckbox = document.createElement('dl')
      favCheckbox.innerHTML = '<dt>お気に入り</dt><dd><input type="checkbox" id="favorite" value="1"><label for="favorite">お気に入りで絞り込み</label></dd>'
      const checkbox = favCheckbox.querySelector('input')
      checkbox.style.width = 'auto'
      checkbox.style.appearance = 'auto'
      checkbox.style.webkitAppearance = 'checkbox'
      checkbox.addEventListener('change', ev => {
        queries.favorites = ev.target.checked
        search()
      })

      form.querySelector('.flex').append(favCheckbox)

      const nameInput = form.querySelector('input[name="search_name"]')
      nameInput.addEventListener('input', ev => {
        queries.names = nameInput.value.split(/\s/)
        search()
      })

      const categorySelect = form.querySelector('select[name="search_job_type"]')
      categorySelect.setAttribute('multiple', true)
      categorySelect.addEventListener('change', ev => {
        const categories = Array.prototype.filter.call(ev.target.options , opt => opt.selected).map(opt => opt.text.trim())
        queries.categories = categories.filter(cat => cat !== 'すべて')
        search()
      })

      const areaSelect = form.querySelector('select[name="search_area"]')
      areaSelect.setAttribute('multiple', true)
      areaSelect.addEventListener('change', ev => {
        const areas = Array.prototype.filter.call(ev.target.options , opt => opt.selected).map(opt => opt.text.trim())
        queries.areas = areas.filter(cat => cat !== 'すべて')
        search()
      })

      const typeSelect = form.querySelector('select[name="search_type"]')
      typeSelect.addEventListener('change', ev => {
        const type = typeSelect.value
        queries.tickets = type
        search()
      })

      const type2Select = form.querySelector('select[name="search_type2"]')
      type2Select.addEventListener('change', ev => {
        const type = type2Select.value
        queries.tickets2 = type
        search()
      })

      search()
    })
})()