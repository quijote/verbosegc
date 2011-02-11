
require 'parse'
require 'digest/md5'

class AnalyzeController < ApplicationController

  def index

  end

  def view
    @name = params["name"]
    s = Snapshot.find_by_name(@name)
    unless s
      redirect_to(:action => :index)
    end
  end

  def data
    name = params["name"]
    s = Snapshot.find_by_name(name)
    if s
      self.content_type ||= Mime::JSON
      self.response_body = s.json
    end
  end

  def upload
    f = params["file"]
    json = analyze_log_file(f.tempfile)
    if(json)
      h = Digest::MD5.hexdigest(json)
      s = Snapshot.new
      s.name = h
      s.json = json
      puts h
      s.save
      redirect_to(:action => :view, :name => h)
    else
      redirect_to(:action => :index)
    end
  end

end
